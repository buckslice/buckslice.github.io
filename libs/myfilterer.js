
var filters = [];
var cards = document.getElementsByClassName("card");
var btnContainer = document.getElementById("myBtnContainer");
var btnGroups = btnContainer.getElementsByClassName("btnGroup");
var buttons = btnContainer.getElementsByClassName("btn");
// for (var i = 0; i < buttons.length; i++) {
//     buttons[i].addEventListener("click", function () {
//         this.classList.toggle("active");
//     });
// }

loadFromHash();

function disableOtherActives(b) {
    if (b.parentNode.classList.contains("btnGroup")) {
        let nodes = b.parentNode.childNodes;
        for (let i = 0; i < nodes.length; ++i) {
            if (nodes[i].tagName == "BUTTON" && nodes[i] != b) {
                if (nodes[i].classList.contains("active")) {
                    let j = filters.indexOf(nodes[i].getAttribute("data-tag"));
                    if (j > -1) {
                        filters.splice(j, 1);
                    }
                    nodes[i].classList.remove("active");
                }
            }
        }
    }
}

function shouldCardBeShown(card) {
    if (!("tag" in card.dataset)) {
        return false;
    }
    let tags = card.getAttribute("data-tag").split(" ");
    for (let i = 0; i < filters.length; ++i) {
        if (tags.indexOf(filters[i]) == -1) {
            return false;
        }
    }
    return true;
}

function loadFromHash(){
    if(location.hash){
        let hf = location.hash.substring(1).split("_");
        console.log(hf);
        for(let i = 0; i < buttons.length; ++i){
            if(hf.indexOf(buttons[i].getAttribute("data-tag")) > -1){
                setFilter(buttons[i]);
            }
        }
    }else{
        showAll();
    }
}

function setHash() {
    let newhash = "#";
    for (let i = 0; i < filters.length; ++i) {
        newhash += filters[i];
        if (i < filters.length - 1) {
            newhash += "_";
        }
    }
    if (newhash == "#") {
        newhash = " ";
    }
    history.replaceState(undefined, undefined, newhash);
}

function setFilter(b) { // adds filter or removes it if its already there

    b.classList.toggle("active");

    let f = b.getAttribute("data-tag");
    let i = filters.indexOf(f);
    if (i > -1) { // if filter is in, then toggle it off
        filters.splice(i, 1);
    } else {
        filters.push(f);

        // since turning on filter check if another active in this group and disable it (this is basically manual scuffed radio buttons)
        //console.log(b.parentNode.childNodes);
        disableOtherActives(b);

    }
    if (filters.length == 0) {
        showAll();
        return;
    } else {
        if (buttons[0].classList.contains("active")) {
            buttons[0].classList.remove("active");
        }
    }

    setHash();

    // recalc filters (operating in AND mode)
    for (let i = 0; i < cards.length; ++i) {
        let shouldShow = shouldCardBeShown(cards[i]);
        let isShowing = cards[i].classList.contains("show")
        if (shouldShow && !isShowing) {
            cards[i].classList.add("show");
        } else if (!shouldShow && isShowing) {
            cards[i].classList.remove("show");
        }
    }
}

function showAll() {
    if (!buttons[0].classList.contains("active")) {
        buttons[0].classList.add("active");
    }
    filters = [];
    // undo all filters and set each button to not active
    for (let i = 1; i < buttons.length; ++i) {
        if (buttons[i].classList.contains("active")) {
            buttons[i].classList.remove("active");
        }
    }
    // add show to every card
    for (let i = 0; i < cards.length; ++i) {
        if (!cards[i].classList.contains("show")) {
            cards[i].classList.add("show");
        }
    }

    setHash();

}
