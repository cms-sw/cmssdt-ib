import * as axios from "axios";
import wrapper from 'axios-cache-plugin';

let httpWrapper = wrapper(axios, {
    maxCacheSize: 50,
    ttl: 5 * 60 * 1000
});
httpWrapper.__addFilter(/\.json/);

export function getSingleFile({fileUrl, onSuccessCallback}) {
    axios.get(fileUrl)
        .then(onSuccessCallback)
        .catch(function (error) {
            console.error(error);
        });
}

// Helper to add a delay
function sleepMS(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
            console.log('Done:', results);
            onSuccessCallback(results);
            return;
        }

        // Launch as many as concurrency allows
        while (active < concurrencyLimit && index < fileUrlList.length) {
            const currentIndex = index++;
            active++;
            console.log('Starting:', currentIndex, active, fileUrlList[currentIndex]);

            // Start the request after a delay to rate limit
            (async (i) => {
                await sleepMS(delayMs); // rate limit
                try {
                    results[i] = await httpWrapper.get(fileUrlList[i]);
                } catch (err) {
                    console.error(err);
                    results[i] = null;
                } finally {
                    active--;
                    next(); // continue scheduling next items
                }
            })(currentIndex);
        }
    }
    next();
}
