import queryString from 'query-string';

/**
 * Replace the URL without adding a new entry in history.
 * @param {function} navigate - the navigate function from useNavigate()
 * @param {string} location - the new URL/path
 */
export function goToLinkWithoutHistoryUpdate(navigate, location) {
    navigate(location, { replace: true });
}

/**
 * Update query parameters in a location object.
 * Returns a new location object compatible with v6
 */
export function partiallyUpdateLocationQuery(location, queryKey, queryValues) {
    let currentQuery = queryString.parse(location.search);
    if (queryValues === "") {
        delete currentQuery[queryKey];
    } else {
        currentQuery[queryKey] = queryValues;
    }
    const newSearch = queryString.stringify(currentQuery);
    return {
        ...location,
        search: newSearch
    };
}
