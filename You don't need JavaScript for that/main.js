document.querySelector("#open").addEventListener("click", () => {
  document.querySelector("dialog").showModal();
});

const dialog = document.querySelector("dialog");

dialog.addEventListener("close", function () {
  console.log(dialog.returnValue);
});
