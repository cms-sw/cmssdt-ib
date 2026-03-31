import axios from "axios";
import wrapper from 'axios-cache-plugin';

let httpWrapper = wrapper(axios, {
    maxCacheSize: 200,
    ttl: 15 * 60 * 1000 // 15 min
});

httpWrapper.__addFilter(/\.json/);

let unauthorizedEventSent = false;

function handleHttpError(error) {
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

            // allow future 401 notifications after a short cooldown
            setTimeout(() => {
                unauthorizedEventSent = false;
            }, 5000);
        }
    }

    throw error;
}

export function getSingleFile({fileUrl, onSuccessCallback}) {
  return httpWrapper
    .get(fileUrl)
    .then((response) => {
      if (typeof onSuccessCallback === "function") {
        onSuccessCallback(response);
      }
      return response;
    })
    .catch(function (error) {
      console.error(error);
      throw error;
    });
}

// Helper to add a delay
function sleepMS(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMultipleFiles({ fileUrlList, onSuccessCallback = () => {} }) {
    fileUrlList = Array.isArray(fileUrlList) ? fileUrlList : [];
    const concurrencyLimit = 2;
    const delayMs = 100;
    let index = 0;
    let active = 0;
    const results = [];

    async function next() {
        if (index >= fileUrlList.length && active === 0) {
            onSuccessCallback(results);
            return;
        }

        while (active < concurrencyLimit && index < fileUrlList.length) {
            const currentIndex = index++;
            active++;

            (async (i) => {
                await sleepMS(delayMs);
                try {
                    results[i] = await httpWrapper.get(fileUrlList[i]);
                } catch (err) {
                    console.error(err);
                    results[i] = null;
                } finally {
                    active--;
                    next();
                }
            })(currentIndex);
        }
    }

    next();
}