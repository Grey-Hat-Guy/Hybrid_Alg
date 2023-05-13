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
    // console.log(folders);
    folderContainer.innerHTML = "";
    folders.forEach(({ name: folderName, isdir }) => {
      const ext = folderName.split(".").pop();

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
      folderLink.textContent = folderName;
      folderLink.classList.add("folder-link");
      const folderIcon = document.createElement("i");
      folderIcon.classList.add("fa-solid");
      folderIcon.classList.add(icons[ext] ? icons[ext] : "fa-folder");
      folderLink.insertBefore(folderIcon, folderLink.firstChild);

      const renameIcon = document.createElement('i');
      renameIcon.classList.add('fa-solid', 'fa-pen-to-square', 'rename-icon');
      renameIcon.setAttribute('data-folder', folderName);
      // renameIcon.addEventListener('click', renameFolder);
      folderLink.appendChild(renameIcon);

      const deleteIcon = document.createElement('i');
      deleteIcon.classList.add('fa-solid', 'fa-trash', 'delete-icon');
      deleteIcon.setAttribute('data-folder', folderName);
      // deleteIcon.addEventListener('click', deleteFolder);
      folderLink.appendChild(deleteIcon);

      const folderDiv = document.createElement("div");
      folderDiv.classList.add("folder");
      folderDiv.appendChild(folderLink);
      folderContainer.appendChild(folderDiv);
    });
  } else {
    console.error("Error loading folders:", folders.status);
    alert("Error loading folders.");
  }
  createBreadcrumb();
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
