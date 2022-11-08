// This page is a work in progress for inspecting a repo straight from the repo page


const setupInspector = () => {
    // setup button
    const a = document.createElement("a");
    a.classList = "btn ml-2 d-none d-md-block";
    a.innerText = 'Inspect';
    // insert action here
    const addFileButton = document.getElementsByClassName("btn ml-2 d-none d-md-block")[0];
    addFileButton.parentElement.insertBefore(a, addFileButton);


}

setTimeout(setupInspector, 1000)
