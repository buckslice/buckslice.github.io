
var filters = [];
var cards = document.getElementsByClassName("card");
var btnContainer = document.getElementById("myBtnContainer");
var buttons = btnContainer.getElementsByClassName("btn");
// for (var i = 0; i < buttons.length; i++) {
//     buttons[i].addEventListener("click", function () {
//         this.classList.toggle("active");
//     });
// }

showAll();

function setFilter(f, b) { // adds filter or removes it if its already there
    let i = filters.indexOf(f);
    b.classList.toggle("active");
    if (i > -1) {
        filters.splice(i, 1);
    } else {
        filters.push(f);
    }
    if (filters.length == 0) {
        showAll();
        return;
    } else {
        if (buttons[0].classList.contains("active")) {
            buttons[0].classList.remove("active");
        }
    }
    // recalc filters (operating in AND mode)
    for (let i = 0; i < cards.length; ++i) {
        let shouldShow = false;
        for (let j = 0; j < filters.length; ++j) {
            if (!cards[i].classList.contains(filters[j])) {
                //shouldShow = true;
                break;
            }
            if (j == filters.length - 1) { // comment this if and undo the ! for other if and uncomment line to make OR
                shouldShow = true;
            }
        }
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

}
