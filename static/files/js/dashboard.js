const liItems = document.querySelectorAll(".sidebar ul li");
const basefolderkey = "all_folders";

window.onload = function () {
  localStorage.clear();
  localStorage.setItem("folderPath", basefolderkey);
};

liItems.forEach(function (liItem) {
  liItem.addEventListener("click", function () {
    const activeLi = document.querySelector(".sidebar ul li.active");
    if (activeLi) {
      activeLi.classList.remove("active");
    }
    this.classList.add("active");
  });
});

const tabContent = document.querySelectorAll(".tab-content .tab-pane");
// Show the active tab on page load
tabContent.forEach((tab) => {
  if (tab.classList.contains("active")) {
    tab.style.display = "block";
  } else {
    tab.style.display = "none";
  }
});

// Switch to the selected tab on click
const tabLinks = document.querySelectorAll('a[data-toggle="tab"]');

tabLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("data-target"));
    tabContent.forEach((tab) => {
      if (tab === target) {
        tab.style.display = "block";
      } else {
        tab.style.display = "none";
      }
    });
  });
});

const createFolderBtn = document.querySelector("#createFolderBtn");
const folderNameInput = document.querySelector("#folderName");
const folderContainer = document.querySelector("#folderContainer");

// Function to get the list of folders and display them

function createBreadcrumb() {
  let folder_path = localStorage.getItem("folderPath");

  if (!folder_path) {
    folder_path = "all_folders";
  }

  const pathArr = folder_path.split("/");
  const breadcrumb = document.querySelector(".breadcrumb");
  breadcrumb.innerHTML = `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
          ${pathArr
            .map((folder, index) => {
              const folderPath = pathArr.slice(0, index + 1).join("/");
              if (index === pathArr.length - 1) {
                return `<li class="breadcrumb-item active" aria-current="page">${folder}</li>`;
              }
              return `<li class="breadcrumb-item"><a href="#" data-folder-path="${folderPath}">${folder}</a></li>`;
            })
            .join("")}
      </ol>
    </nav>
  `;

  const breadcrumbLinks = document.querySelectorAll(".breadcrumb a");
  breadcrumbLinks.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const folderPath = link.getAttribute("data-folder-path");
      console.log(`Navigating to folder: ${folderPath}`);
      showFolders(folderPath);
      localStorage.setItem("folderPath", folderPath);
      await updateCreatFolderDropdown(folderPath);
      // You can call a function here to navigate to the folder
      // Example: navigateToFolder(folderPath)
    });
  });
}

const newFolderModal = document.querySelector("#newFolderModal");
const bootstrapModal = bootstrap.Modal.getInstance(newFolderModal);
const folderParent = document.querySelector("#folderParent");

folderParent.addEventListener("change", function (e) {
  console.log(e.target.value);
});

newFolderModal.addEventListener("show.bs.modal", async function (e) {
  let folder = localStorage.getItem("folderPath") || "all_folders";

  const res = await fetch("/getFoldersonly?folderkey=" + folder);

  if (res.status !== 200) {
    console.error("Error loading folders:", res.status);
    alert("Error loading folders.");
    return;
  }
  const folders = await res.json();

  folderParent.innerHTML = `<option value="">Select a folder</option>`;

  folders.forEach((folderName) => {
    const _sele = document.createElement("option");
    _sele.value = folderName;
    _sele.textContent = folderName;
    folderParent.appendChild(_sele);
  });
});

createFolderBtn.addEventListener("click", async function (e) {
  e.preventDefault();
  const newFolderModal = document.querySelector("#newFolderModal");
  const bootstrapModal = bootstrap.Modal.getInstance(newFolderModal);

  bootstrapModal.hide();

  // Send a POST request to the server to create the folder
  const folderName = folderNameInput.value;
  let folderParentKey = !folderParent.value
    ? localStorage.getItem("folderPath")
    : localStorage.getItem("folderPath") + "/" + folderParent.value;

  const response = await fetch("/createFolder", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify({ name: folderName, parentKey: folderParentKey }),
  });

  try {
    const responseData = await response.json();
    const newFolderName = responseData.folderName;
    const folders = responseData.folders;
    localStorage.setItem("folderPath", folderParentKey);
    showFolders(folderParentKey);
    folderNameInput.value = "";
  } catch (error) {
    console.error("Error parsing server response:", error);
    alert("Error parsing server response.");
  }
});

showFolders(basefolderkey);

function renderFolders(folders) {
  folderContainer.innerHTML = "";
  folders.forEach((folderName) => {
    const folderUrl = "/folders/" + folderName;
    const folderLink = document.createElement("a");
    folderLink.href = folderUrl;
    folderLink.textContent = folderName;
    const folderDiv = document.createElement("div");
    folderDiv.classList.add("folder");
    folderDiv.appendChild(folderLink);
    folderContainer.appendChild(folderDiv);
  });
}

const searchBtn = document.querySelector("#searchBtn");

searchBtn.addEventListener("click", searchFolders);

function searchFolders() {
  const searchBox = document.querySelector("#searchBox");
  const searchText = searchBox.value.toLowerCase();

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/searchFolders");
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const folders = JSON.parse(xhr.responseText);
          const filteredFolders = folders.filter((folderName) =>
            folderName.toLowerCase().includes(searchText)
          );
          renderFolders(filteredFolders);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
        }
      } else {
        console.error("Error loading folders:", xhr.status);
      }
    }
  };
  xhr.send();
}
