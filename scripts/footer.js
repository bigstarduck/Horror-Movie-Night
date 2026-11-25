const copyrightText = document.querySelector("#currentyear");
const lastModifiedText = document.querySelector("#lastModified");

if (copyrightText) {
    const currentYear = new Date().getFullYear();
    copyrightText.innerHTML = `&copy;${currentYear}<span> Classy Movie Nights LLC</span>`;
}

if (lastModifiedText) {
    lastModifiedText.textContent = `Last Modification: ${document.lastModified}`;
}
