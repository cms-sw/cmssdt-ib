import * as axios from "axios";
import wrapper from 'axios-cache-plugin';
import limit from 'p-limit';

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

export function getMultipleFiles({fileUrlList, onSuccessCallback}) {
    const concurrencyLimit = 3; // max 3 requests at a time
    const limiter = limit(concurrencyLimit);

    const limitedRequests = fileUrlList.map(url =>
        limiter(() => httpWrapper.get(url))
    );

    Promise.all(limitedRequests)
        .then(onSuccessCallback)
        .catch(error => {
            console.error('Error fetching files:', error);
        });
}

