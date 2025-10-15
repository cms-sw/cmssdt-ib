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

export function getMultipleFiles({ fileUrlList, onSuccessCallback }) {
    const concurrencyLimit = 3; // Max 3 requests
    let index = 0;
    let active = 0;
    const results = [];

    function next() {
        if (index >= fileUrlList.length && active === 0) {
            onSuccessCallback(results);
            return;
        }

        while (active < concurrencyLimit && index < fileUrlList.length) {
            const currentIndex = index++;
            active++;

            httpWrapper.get(fileUrlList[currentIndex])
                .then(res => { results[currentIndex] = res; })
                .catch(err => { console.error(err); results[currentIndex] = null; })
                .finally(() => {
                    active--;
                    next();
                });
        }
    }
    next();
}
