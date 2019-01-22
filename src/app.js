import 'bootstrap';
import './sass/main.scss';
import Sites, { loadJSON } from './sherlock';


// UI controller
const UIController = (() => {

    const DOMStrings = {
        username: 'username__holder',
        submit_btn: '.username__submit--button',
        spinner: '#progress__spinner',
        counter: 'found__counter'
    };

    const colorStatus = ['bg-avail', 'bg-taken', 'bg-grey', 'bg-red'];

    const updateContent = (id, className, url) => {
        let el = document.getElementById(id);
        el.classList.add(className);
        el.setAttribute('href', url);
    };

    return {

        updateUI: (sitename, status, url) => {
            if (status === 'avail') {
                updateContent(sitename, colorStatus[0], url);
            } else if (status === 'taken') {
                updateContent(sitename, colorStatus[1], url);
            } else if (status === 'invalid') {
                updateContent(sitename, colorStatus[2], url);
            } else if (status === 'error') {
                updateContent(sitename, colorStatus[3], url);
            }
        },

        updateCount: (count) => {
            document.getElementById(DOMStrings.counter).textContent = count;
        },


        resetClass: () => {
            for (let className of colorStatus) {
                $('a').removeClass(className);
            }
        },

        removeClass: (id, className) => {
            $(id).removeClass(className);
        },

        getDOMStrings: () => {
            return DOMStrings;
        }
    };

})();


// Username Handler
const handleController = ((UICtrl) => {


    // searching process
    const searchUserName = async (username, key, value) => {
        let url = value.url, sitename = key, countTaken = 0;
        const user = new Sites(username, url);
        return user.getUserName(value)
            .then(result => {
                if (result.statusCode === 404 || result.statusCode === 410) {
                    UICtrl.updateUI(sitename, 'avail', result.origUrl);
                } else if (result.statusCode === 200) {
                    ++countTaken;
                    UICtrl.updateUI(sitename, 'taken', result.profileUrl);
                    return countTaken;
                } else if (result.statusCode === 504) {
                    UICtrl.updateUI(sitename, 'error', result.origUrl);
                } else {
                    console.log(`Status: ${result.statusCode}`);
                    UICtrl.updateUI(sitename, 'error', result.origUrl);
                }
            });
    };

    // Search Handler
    const startSearch = (jsonObj, username) => {
        let counter = 0;
        // traverse json
        Object.entries(jsonObj).forEach(([key, value]) => {
            // proceed if length satifies
            if (username.length >= value.minChar) {
                // start searching
                searchUserName(username, key, value).then(val => {
                    // sites count
                    if (!isNaN(val)) {
                        counter += val;
                        UICtrl.updateCount(counter);
                        console.log(counter);
                    }
                });
            } else {
                // length < min required
                UICtrl.updateUI(key, 'invalid', value.urlMain);
            }
        });
    };


    return {

        // json extrator
        extractJSON: (username) => {
            // call async 
            loadJSON()
                .then(jsonObj => {
                    startSearch(jsonObj, username);
                })
                .catch(err => {
                    console.log(err);
                });
        }

    }

})(UIController);


// Global APP controller
const appController = ((UICtrl, handleCtrl) => {
    let DOM = UICtrl.getDOMStrings();

    // obtain from input
    const readUsername = () => {
        let username;
        username = document.getElementById(DOM.username).value;
        return username;
    };

    // respond to events
    const setUpEventListeners = () => {

        // key press
        document.addEventListener('keypress', (e) => {
            let keyCode = e.which || e.keyCode;
            let username;
            // enter key
            if (keyCode === 13) {
                username = readUsername();
                UICtrl.resetClass();
                handleCtrl.extractJSON(username);
            }
        });

        // search button
        document.querySelector(DOM.submit_btn).addEventListener('click', () => {
            let username = readUsername();
            UICtrl.resetClass();
            UICtrl.removeClass(DOM.spinner, 'v-none');
            handleCtrl.extractJSON(username);
        });

    };


    return {

        // start 
        init: () => {
            setUpEventListeners();
        }
    };


})(UIController, handleController);


// initialize
appController.init();