let friendList = {
        sign: '+',
        items: []
    },
    favoritFriendList = {
        sign: '-',
        items: []
    };

if (localStorage.favoritFriendList) {
    favoritFriendList = JSON.parse(localStorage.favoritFriendList);
}


VK.init({
    apiId: 6668731
});

function auth() {

    return new Promise((resolve, reject) => {
        VK.Auth.login( data => {
            if (data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
}

function callAPI(method, params) {
    params.v = '5.80';

    return new Promise((resolve, reject) => {
        VK.Api.call(method, params, (data) => {
            if (data.error) {
                reject(data.error);
            } else {
                resolve(data.response);
            }
        });
    });
}

(async () => {
    try{
        await auth();

        let friends = await callAPI('friends.get', {fields: 'photo_50'});

        for (let friend of friends.items) {
            if (findItem (favoritFriendList, friend.id) == -1) {
               friendList.items.push(friend);
            }
        }

        renderLists();

    } catch (e){
        console.log(e);
    }
})();


let domFriendList = document.querySelector('#results');
let domFavoriteFriendList = document.querySelector('#favorite');
makeDnD([domFriendList, domFavoriteFriendList]);

let body = document.body;
body.addEventListener('click', (e) => {
    if(e.target.classList.contains('sign')) {
        let elem = e.target.closest('.friend');
        let elemId = +elem.dataset.id;
        if (e.target.innerHTML === '+') {
            moveItem(friendList, elemId, favoritFriendList);

            renderLists();

        } else {
            moveItem(favoritFriendList, elemId, friendList);

            renderLists();
        }
    }
});

let findFriend = document.querySelector('#findFriend');
let findFavoritFriend = document.querySelector('#findFavoritFriend');
let saveBtn = document.querySelector('#save');

findFriend.addEventListener('keyup', () => {
    renderFriendList();
});

findFavoritFriend.addEventListener('keyup', () => {
    renderFavoriteFriendList();
});

save.addEventListener('click', () => {
    localStorage.favoritFriendList = JSON.stringify(favoritFriendList);
});

function findItem (obj, id) {
    let arr = obj.items;

    for(let i = 0; i < arr.length; i++) {
        if (arr[i].id === id) {
            return i;
        }
    }

    return -1;
}

function removeItem (obj, id) {
    let idx = findItem(obj, id);

    obj.items.splice(idx, 1);
}

function moveItem (objFrom, fromId, objTo){
    objTo.items.push(objFrom.items[findItem(objFrom, fromId)]);
    removeItem(objFrom, fromId);
}

function renderList (domElSelector, model) {
    const template = document.querySelector('#user-template').textContent;
    const render = Handlebars.compile(template);
    const html = render(model);
    const domEl = document.querySelector(domElSelector);

    domEl.innerHTML = html;
}

function renderFilteredList (domSelector, ftList, ftValue) {
    const filteredList = filterList(ftList, ftValue);
    renderList(domSelector, filteredList);
}

function renderFriendList () {
    renderFilteredList ('#results', friendList, findFriend.value);
}

function renderFavoriteFriendList () {
    renderFilteredList ('#favorite', favoritFriendList, findFavoritFriend.value);
}

function renderLists () {
    renderFriendList();
    renderFavoriteFriendList();
}

function filterList (obj, filterValue) {
    let arr = obj.items;
    let resArr = arr.filter((el) => {
        return (
                el.first_name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1 ||
                el.last_name.toLowerCase().indexOf(filterValue.toLowerCase()) > -1
                );
    });

    return {
        sign: obj.sign,
        items: resArr
    };
}


function makeDnD(zones) {
    let currentDrag;

    zones.forEach(zone => {
        zone.addEventListener('dragstart', (e) => {
            currentDrag = { source: zone, node: e.target };
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        zone.addEventListener('drop', (e) => {
            if (currentDrag) {
                e.preventDefault();

                if (currentDrag.source !== zone) {

                    let elem = currentDrag.node.closest('.friend');
                    let elemId = +elem.dataset.id;
                    
                    if (e.target.id === 'favorite') {
                        moveItem(friendList, elemId, favoritFriendList);
                    } else {
                        moveItem(favoritFriendList, elemId, friendList);
                    }
                    renderLists();
                }

                currentDrag = null;
            }
        });
    })
}