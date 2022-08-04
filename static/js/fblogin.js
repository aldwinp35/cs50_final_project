
window.fbAsyncInit = function() {
    FB.init({
        appId      : '575324293981420',
        cookie     : true,
        xfbml      : true,
        version    : '12.0'
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

async function statusChangeCallback(response)
{
    if (response)
    {
        // response.status: specifies the login status of the person using the app.
        // connected - the person is logged into Facebook, and has logged into your app
        if (response.status === 'connected')
        {
            const accountsInfo = await getAccountsInfo(response.authResponse.accessToken);
            console.log(accountsInfo);

            // FB.api('/me?fields=name,email,picture', function (user) {
            //     if (!user.error)
            //     {
            //         user.pages = accountsInfo;
            //         response.authResponse.user = user;
            //         const data = response.authResponse;

            //         fetch('/login', {
            //             "method": "POST",
            //             headers: {
            //                 'Content-Type': 'application/json'
            //             },
            //             body: JSON.stringify(data)
            //         })
            //         .then(res => res.json())
            //         .then(data => {
            //             if (data.success)
            //             {
            //                 window.location.reload();
            //             }
            //         })
            //         .catch((error) => {
            //             console.error('Error:', error);
            //         });
            //     }
            // });
        }
    }
}

async function getAccountsInfo(token)
{
    let info = [];
    const fb_pages = await getFacebookPages(token);

    for (let i = 0; i < fb_pages.length; i++) {
        let account = await getInstagramIdAndUsername(fb_pages[i].id, token);
        if (account !== undefined) {
        fb_pages[i].account = account;
        info.push(fb_pages[i]);
        }
    }

    return info;
}

async function getFacebookPages(token)
{
    let fb_pages = [];
    try
    {
        const req = await fetch(`https://graph.facebook.com/v10.0/me/accounts?access_token=${token}`);
        const res = await req.json();
        res.data.forEach((item) => {
            let page = {
                id: item.id,
                name: item.name,
                category: item.category
            };

            fb_pages.push(page);
        });
    } catch (error) {
        console.log(error);
    }

    return fb_pages;
}

async function getInstagramIdAndUsername(pageId, token)
{
    try
    {
        const req = await fetch(`https://graph.facebook.com/v10.0/${pageId}?fields=instagram_business_account&access_token=${token}`);
        const res = await req.json();
        if (res.hasOwnProperty("instagram_business_account"))
        {
            const username = await getInstagramUsername(res.instagram_business_account.id, token);
            return {
                id: res.instagram_business_account.id,
                username: username
            };
        }
    } catch (error) {
        console.log("error: ", error);
    }
}

async function getInstagramUsername(accountId, token)
{
    try
    {
        const req = await fetch(`https://graph.facebook.com/v10.0/${accountId}?fields=username&access_token=${token}`);
        const res = await req.json();
        return await res.username;

    } catch (error) {
        console.log(error);
    }
}