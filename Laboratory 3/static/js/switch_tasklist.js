// UPDATES THE DROPDOWN SWITCHER WITH THE CHECK ICON
// TO INDICATE THE CURRENT TO DO LIST

document.querySelectorAll('.switcher-item').forEach(item => {
    item.addEventListener('click', function () {
    // remove 'active' from all
    document.querySelectorAll('.switcher-item').forEach(i => i.classList.remove('active'));
            
    // add 'active' to the clicked one
    this.classList.add('active');

    // update the button text to reflect the current space
    const selectedName = this.querySelector('.switcher-name').textContent.trim();
    document.querySelector('.switcherBtn .switcher-name').textContent = selectedName;
    });
});