import * as axios from "axios";
import wrapper from 'axios-cache-plugin';

let httpWrapper = wrapper(axios, {
    maxCacheSize: 50,
    ttl: 5 * 60 * 1000
});
httpWrapper.__addFilter(/\.json/);

// Helper to add a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getSingleFile({fileUrl, onSuccessCallback}) {
    axios.get(fileUrl)
        .then(onSuccessCallback)
        .catch(function (error) {
            console.error(error);
        });
}

// Helper to add a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getMultipleFiles({ fileUrlList, onSuccessCallback = () => {} }) {
    fileUrlList = Array.isArray(fileUrlList) ? fileUrlList : [];
    const concurrencyLimit = 2;
    const delayMs = 100;
    let index = 0;
    let active = 0;
    const results = [];

    function next() {
        if (index >= fileUrlList.length && active === 0) {
            onSuccessCallback(results); // safe now
            return;
        }

        while (active < concurrencyLimit && index < fileUrlList.length) {
            const currentIndex = index++;
            active++;
            console.log('Starting:', currentIndex, active, fileUrlList[currentIndex]);
            sleep(delayMs).then(() =>
                httpWrapper.get(fileUrlList[currentIndex])
                    .then(res => { results[currentIndex] = res; })
                    .catch(err => {
                        console.error(err);
                        results[currentIndex] = null;
                    })
                    .finally(() => {
                        active--;
                        next();
                    })
            );
        }
    }

    next();
}
