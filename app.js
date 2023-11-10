/*
 * The application's bootstrap code.
 */

(function() {
    const body = document.getElementsByTagName('body')[0];
    const displayTime = 350;
    const hideTime = 250;
    let loaded = false;

    const stopLoadingMessage = () => {
        loaded = true;
    }

    const removeLoading = () => {
        console.log("Removing the loading message...");
        let msgLoading = document.getElementById('msgLoading');
        msgLoading.remove();

        setTimeout(displayLoading, hideTime);
    }

    const displayLoading = () => {
        if(loaded) {
            console.log("Stopping the loading message now.");
            return;
        }

        console.log("Displaying the loading message...");

        let msgLoading = document.createElement('p');
        msgLoading.id = 'msgLoading';
        msgLoading.innerText = 'Application is loading, please wait...';
    
        body.appendChild(msgLoading);
        setTimeout(removeLoading, displayTime);
    }

    // The application entrypoint.
    const startup = () => {
        displayLoading();
    }
    

})();