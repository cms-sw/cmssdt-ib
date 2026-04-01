import axios from "axios";
import wrapper from 'axios-cache-plugin';

let httpWrapper = wrapper(axios, {
    maxCacheSize: 200,
    ttl: 15 * 60 * 1000 // 15 min
});

httpWrapper.__addFilter(/\.json/);

let unauthorizedEventSent = false;

function handleHttpError(error, onErrorCallback) {
    console.error(error);

    const status = error?.response?.status;

    if (status === 401) {
        if (!unauthorizedEventSent) {
            unauthorizedEventSent = true;

            window.dispatchEvent(
                new CustomEvent("app:unauthorized", {
                    detail: {
                        message: "Your session has expired. Please refresh the page and sign in again.",
                        status
                    }
                })
            );

            setTimeout(() => {
                unauthorizedEventSent = false;
            }, 5000);
        }
    }

    if (typeof onErrorCallback === "function") {
        onErrorCallback(error);
    }

    throw error;
}

export function getSingleFile({ fileUrl, onSuccessCallback, onErrorCallback }) {
    return httpWrapper
        .get(fileUrl)
        .then((response) => {
            if (typeof onSuccessCallback === "function") {
                onSuccessCallback(response);
            }
            return response;
        })
        .catch((error) => handleHttpError(error, onErrorCallback));
}

// Helper to add a delay
function sleepMS(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMultipleFiles({
    fileUrlList,
    onSuccessCallback = () => {},
    onErrorCallback = () => {}
}) {
    fileUrlList = Array.isArray(fileUrlList) ? fileUrlList : [];

    if (fileUrlList.length === 0) {
        onSuccessCallback([]);
        return Promise.resolve([]);
    }

    const concurrencyLimit = 2;
    const delayMs = 100;

    let index = 0;
    let active = 0;
    let completed = 0;
    let hasFatalError = false;

    const results = new Array(fileUrlList.length);

    return new Promise((resolve, reject) => {
        async function next() {
            if (hasFatalError) return;

            if (completed === fileUrlList.length && active === 0) {
                onSuccessCallback(results);
                resolve(results);
                return;
            }

            while (active < concurrencyLimit && index < fileUrlList.length && !hasFatalError) {
                const currentIndex = index++;
                active++;

                (async (i) => {
                    await sleepMS(delayMs);

                    try {
                        const response = await httpWrapper.get(fileUrlList[i]);
                        results[i] = response;
                    } catch (error) {
                        hasFatalError = true;
                        handleHttpError(error, onErrorCallback);
                        reject(error);
                        return;
                    } finally {
                        active--;
                        completed++;

                        if (!hasFatalError) {
                            next();
                        }
                    }
                })(currentIndex);
            }
        }

        next();
    });
}