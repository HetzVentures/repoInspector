import {api} from '@/js/api'
import { popupCenter } from '@/js/helpers'

export class Authentication {
    // Authentication is done via google oauth2 flow. As at the time of developing this extension google did not support login directly
    // from a chrome extension, we are logging in from a popup. In order to load the data properly into the extension, the extension
    // first creates a email_user at login/email_user/ and then allows for opening a the popup with that users uuid as a url param.
    // This allows us to open a url for logging in with google which is associated to the same user who we just created. On the next time
    // the chrome extension will be opened, the user will be refreshed with the new data from google.
    
    constructor() {

        this.currentUser = {};
        chrome.storage.local.get(async ({ CURRENT_USER }) => {

            if (!CURRENT_USER) {
                // create user for this extension instance to send emails to,
                // at this point there is no data from the user aside from the uuid
                const data = await api.post('login/email_user/');
                CURRENT_USER = data;
                chrome.storage.local.set({ CURRENT_USER });
            }
            else if (CURRENT_USER.uuid && !CURRENT_USER.email) {
                // if we have created a user, make sure the login from google has worked and the email is updated
                const data = await api.get(`login/email_user/${CURRENT_USER.uuid}`);
                CURRENT_USER = data;
                await chrome.storage.local.set({ CURRENT_USER });
            }
            this.currentUser = CURRENT_USER;
        })
    }
    
    logout() {
        chrome.storage.local.clear();
    }

    loginWithGoogle() {
        const loginPopup = popupCenter({
            url: `${api.urlBase}/login/${this.currentUser.uuid}`,
            title: 'login',
            w: 100,
            h: 100
        });
        // close popup once the login is complete
        const timer = setInterval(() => { 
            if(loginPopup.closed) {
                clearInterval(timer);
            }
        }, 1000);
    }

}

export const auth = new Authentication();