import {DevApp} from "./DevApp";

//export * from './DevApp';

if (process.env.NODE_ENV === 'development') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('dev')) {
        try {
            DevApp.init();
        } catch {
        }
    }
}