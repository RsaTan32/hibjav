function switchTab(event, tabName) {
  const links = document.querySelectorAll(".nav-links li");
  links.forEach((link) => link.classList.remove("active"));
  event.currentTarget.classList.add("active");

  const allTabs = document.querySelectorAll(".tab-content");
  allTabs.forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active-tab");
  });

  const activeTab = document.getElementById("tab-" + tabName);
  if (activeTab) {
    activeTab.classList.add("active-tab");
    activeTab.style.display = "block";
    const titles = {
      pivot: "Mátrix Pivotálás",
      parity: "Paritásmátrix számolás",
      "matrix-multiplication": "Mátrix Szorzás",
      history: "Előzmények",
    };
    document.getElementById("current-title").innerText = titles[tabName];
  }
}

// Segédfüggvény a mátrix törléséhez
function clearMatrix() {
  const inputs = document.querySelectorAll(".matrix-input, .matrix-cell-input");
  inputs.forEach((input) => (input.value = 0));
}
