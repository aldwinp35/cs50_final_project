
const app_id = document.getElementById('app_id');
const app_version = document.getElementById('app_version');

window.fbAsyncInit = function() {
    FB.init({
        appId      : app_id.value,
        cookie     : true,
        xfbml      : true,
        version    : app_version.value
    });

    FB.AppEvents.logPageView();
};

(function(d, s, id){
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function checkLoginState(){
    FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
    });
}

function statusChangeCallback(response)
{
    if (response)
    {
        // response.status: specifies the login status of the person using the app.
        // connected - the person is logged into Facebook, and has logged into your app
        if (response.status === 'connected')
        {
            // Get facebook page id
            FB.api('/me/accounts?fields=id', function (fbPageIdResponse) {
                if (!fbPageIdResponse.error)
                {
                    // Get Account page id
                    FB.api(`${fbPageIdResponse['data'][0].id}?fields=instagram_business_account`, async function (igAccountIdResponse) {
                        if (!igAccountIdResponse.error)
                        {
                            // Add ig_id to response
                            response.ig_id = igAccountIdResponse['instagram_business_account'].id;

                            // Send response
                            const loginResponse = await request('/login', 'POST', response);
                            if (loginResponse.ok) location.href = location.origin;
                        }
                    }); // igAccountIdResponse
                }
            }); // fbPageIdResponse
        }
    }
}