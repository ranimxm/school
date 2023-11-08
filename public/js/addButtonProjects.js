const addProjectButton = document.querySelector("#addProjectBtn");
const createProjectForm = document.querySelector("#createProject");
const projectNameInput = document.querySelector("#projectName");
const confirmButton = document.querySelector("#confirmBtn");
const modal = document.querySelector("#myModal");
const closeModal = document.querySelector("#closeModal");

document.addEventListener("click", (event) => {
    if (event.target === addProjectButton) {
        modal.style.display = "block";
        projectNameInput.focus();
    } else if (event.target === confirmButton) {
        createProjectForm.submit();
    } else if (event.target === closeModal) {
        modal.style.display = "none";
    } else if (event.target === modal) {
        modal.style.display = "none";
    }
});