// function insertText() {

// 	// var element = document.getElementById('form-header'),
//  //    elementChild = document.createElement("div");
// 	// document.getElementById('form-header').innerHTML = '<a href="#" id="menudrop" class="menudrop">Menu &#x25BC;</a>';

// 	// insert it
// 	// element.insertBefore(elementChild, element.firstChild);

// 	// run onclick of the menu button
// 	element.onclick = function() { toggleclass(); };

// }

function toggleclass() {
	var mq = window.matchMedia( "(min-width: 769px)" );
	var menu = document.querySelector('.ui-tabs-nav');

	if (mq.matches) {
	  // window width is at least 769px
	} 
	else if (menu) {
	  	menu.classList.toggle('nava'); 
	}
}