async function updateCreatFolderDropdown(folderpath) {
  const res = await fetch("/getFoldersonly?folderkey=" + folderpath);
  if (res.status !== 200) {
    console.error("Error loading folders:", res.status);
    alert("Error loading folders.");
    return;
  }
  const folders = await res.json();

  folderParent.innerHTML = `<option value="">Select a folder</option>`;

  folders.forEach((folderName) => {
    const _sele = document.createElement("option");
    _sele.value = folderName.name;
    _sele.textContent = folderName.name;
    folderParent.appendChild(_sele);
  });
}

async function showFolders(folderkey) {
  const basefolderkey = "all_folders";
  const res = await fetch("/getallFiles?folderkey=" + folderkey);
  const icons = {
    doc: "fa-file-word",
    docx: "fa-file-word",
    pdf: "fa-file-pdf",
    jpg: "fa-image",
    png: "fa-image",
    gif: "fa-image",
    py: "fa-file-code"
  };

  if (res.status === 200) {
    const folders = await res.json();
    folderContainer.innerHTML = "";

    folders.forEach(({ name: folderName, isdir }) => {
      const ext = folderName.split(".").pop();

      if (ext !== "enc") {
        const folderUrl = "/folders/" + folderName;
        const folderLink = document.createElement("a");
        folderLink.href = "#";
        folderLink.addEventListener("click", function (e) {
          if (!isdir) {
            fileurl =
              "/viewFile?filename=" +
              folderName +
              "&parentKey=" +
              localStorage.getItem("folderPath");
            // decryptFile(folderName);
            window.open(fileurl, "_blank");
            return;
          }

          if (!localStorage.getItem("folderPath")) {
            localStorage.setItem(
              "folderPath",
              localStorage.getItem("folderPath") + "/" + folderName
            );
          } else {
            let prev_folderPath = localStorage.getItem("folderPath");
            localStorage.setItem(
              "folderPath",
              prev_folderPath + "/" + folderName
            );
          }
          let folderPath = localStorage.getItem("folderPath");
          showFolders(folderPath);
        });

        const folder_path = localStorage.getItem("folderPath");

        const folderDiv = document.createElement("div");
        folderDiv.classList.add("folder");

        folderLink.textContent = folderName;
        folderLink.classList.add("folder-link");
        const folderIcon = document.createElement("i");
        folderIcon.classList.add("fa-solid");
        folderIcon.classList.add(icons[ext] ? icons[ext] : "fa-folder");
        folderLink.insertBefore(folderIcon, folderLink.firstChild);
        folderDiv.appendChild(folderLink);

        const iconContainer = document.createElement("div");
        iconContainer.classList.add("icon-container");

        const renameIcon = document.createElement('i');
        renameIcon.classList.add('fa-solid', 'fa-pen-to-square', 'rename-icon');
        renameIcon.setAttribute('data-folder', folderName);
        renameIcon.addEventListener('click', function (event) {
          renameFolder(event, folder_path)
        });
        iconContainer.appendChild(renameIcon);

        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fa-solid', 'fa-trash', 'delete-icon');
        deleteIcon.setAttribute('data-folder', folderName);
        deleteIcon.addEventListener('click', function (event) {
          deleteFolder(event, folder_path)
        });
        iconContainer.appendChild(deleteIcon);

        folderDiv.appendChild(iconContainer);

        folderContainer.appendChild(folderDiv);
      }
    });
  } else {
    console.error("Error loading folders:", folders.status);
    alert("Error loading folders.");
  }
  createBreadcrumb();
}

function decryptFile(filename) {
  fetch("/decryptFile", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ filename: filename })
  })
    .then((response) => response.blob())
    .then((blob) => {
      // Create a temporary URL for the decrypted file
      const url = window.URL.createObjectURL(blob);
      // Create a temporary anchor element to initiate the file download
      const a = document.createElement("a");
      const filenameWithoutExtension = filename.substring(0, filename.lastIndexOf(".enc"));
      const downloadFilename = filenameWithoutExtension + ".txt";
      a.href = url;
      a.download = downloadFilename // Set the downloaded file name
      a.click(); // Initiate the file download
      window.URL.revokeObjectURL(url); // Release the object URL
    })
    .catch((error) => {
      console.error("Failed to decrypt and download file:", error);
    });
}

function renameFolder(event, folder_path) {
  const folderName = event.target.getAttribute("data-folder");
  const newFolderName = prompt("Enter new folder name:");
  if (newFolderName !== null) {
    const folderLink = event.target.parentNode.previousSibling;
    folderLink.textContent = newFolderName;
    event.target.setAttribute("data-folder", newFolderName);
    const data = { folderName: folderName, newFolderName: newFolderName, folder_path: folder_path };
    fetch("/rename-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => location.reload())
      .catch((error) => console.error(error));
  }
}

//  Function to handle folder deletion
function deleteFolder(event, folder_path) {
  const folderName = event.target.getAttribute("data-folder");
  const confirmDelete = confirm("Are you sure you want to delete the folder?");

  if (confirmDelete) {
    // Send AJAX request to move folder to bin
    fetch("/delete-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderName: folderName, folder_path: folder_path }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success) {
          // Remove the folder element from the UI
          const folderDiv = event.target.closest(".folder");
          folderDiv.remove();
          location.reload();
        } else {
          alert("Failed to delete folder.");
        }
      });
  }
}

async function createFile(event, folderkey) {
  const newFileModal = document.querySelector("#newFileModal");
  const bootstrapModal = bootstrap.Modal.getInstance(newFileModal);
  event.preventDefault();

  const filename = document.getElementById("filename");
  const file = document.getElementById("fileUpload");

  if (!filename.value || !file.files[0]) {
    alert("Please fill all the fields");
    return;
  }

  const formData = new FormData();
  formData.append("file", file.files[0]);
  formData.append("filename", filename.value);
  formData.append("parentKey", folderkey);

  const res = await fetch("/uploadFile", {
    method: "POST",
    body: formData,
  });

  if (res.status == 200) {
    bootstrapModal.hide();
    filename.value = "";
    showFolders(localStorage.getItem("folderPath"));
  } else {
    console.log("not working");
  }
}

const fileUploadForm = document.getElementById("fileUploadForm");
fileUploadForm.addEventListener("submit", async (e) =>
  createFile(e, localStorage.getItem("folderPath"))
);

fetch("/getBinFolders")
  .then(response => response.json())
  .then(data => {
    const binFoldersList = document.getElementById("binFoldersList");
    binFoldersList.innerHTML = "";

    // Access folders and files properties in the data object
    const folders = data.folders;
    const files = data.files;

    folders.forEach(folder => {
      const li = document.createElement("li");
      li.innerText = folder;
      binFoldersList.appendChild(li);
    });

    // Iterate over files
    files.forEach(file => {
      const li = document.createElement("li");
      li.innerText = file;
      binFoldersList.appendChild(li);
    });
  });