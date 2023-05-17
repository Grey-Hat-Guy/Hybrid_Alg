#!/usr/bin/python3

import os
import shutil
import test
from flask import Flask, render_template, request, flash, jsonify, url_for, redirect
from flask import send_file

app = Flask(__name__)
app.secret_key = "123"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

@app.route("/")
def home():
    return render_template("login.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")

        if email == "test@test.com" and password == "123":
            return redirect(url_for("dashboard"))
        else:
            flash("Incorrect Details", "danger")
            return render_template("login.html")
    return render_template("login.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html", title="Dashboard")


@app.route("/createFolder", methods=["POST"])
def createFolder():
    data = request.get_json()
    folderName = data["name"]
    parentFolder = data["parentKey"]
    parentFolder = os.path.join(BASE_DIR, parentFolder)

    try:
        # Create the new folder in the "all_folders" directory
        if not os.path.isdir(os.path.join(parentFolder, folderName)):
            os.mkdir(os.path.join(parentFolder, folderName))
    except FileExistsError:
        # If the folder already exists, return an error message
        return jsonify({"error": f"Folder {folderName} already exists"}), 400
    except Exception as e:
        print(str(e))
        # For other errors, return a generic error message
        return jsonify({"error": "Could not create folder"}), 500

    folders = os.listdir(parentFolder)
    return jsonify({"folderName": folderName, "folders": folders})


@app.route("/getallFiles")
def getFolders():
    folderkey = request.args.get("folderkey")
    parentFolder = os.path.join(BASE_DIR, folderkey)
    folders = os.listdir(parentFolder)
    folders = [{"name" : folder, "isdir" : os.path.isdir(os.path.join(parentFolder, folder))} for folder in folders]
    return jsonify(folders)

# @app.route("/getallFiles")
# def getFolders():
#     folderkey = request.args.get("folderkey")
#     parentFolder = os.path.join(BASE_DIR, folderkey)
#     folders = os.listdir(parentFolder)

#     binFolder = os.path.join(BASE_DIR, "bin")
#     deletedFolders = []

#     if os.path.exists(binFolder):
#         deletedFolders = os.listdir(binFolder)
    
#     folder_data = []
#     for folder in folders:
#         folder_path = os.path.join(parentFolder, folder)
#         is_directory = os.path.isdir(folder_path)
#         is_deleted = folder in deletedFolders

#         folder_info = {"name" : folder, "isdir" : is_directory, "deleted" : is_deleted}
#         folder_data.append(folder_info)

#     return jsonify(folder_data)


@app.route("/getFoldersonly")
def getFoldersOnly():
    folderkey = request.args.get("folderkey")
    parentFolder = os.path.join(BASE_DIR, folderkey)
    folders = os.listdir(parentFolder)
    folders = [folder for folder in folders if os.path.isdir(os.path.join(parentFolder, folder))]
    return jsonify(folders)

# @app.route("/uploadFile", methods=["POST"])
# def uploadFile():
#     filename = request.form.get("filename")
#     parentFolder = request.form.get("parentKey")
#     parentFolder = os.path.join(BASE_DIR, parentFolder)

#     file = request.files["file"]

#     # change extension to original extension
#     originalFileExtension = os.path.splitext(file.filename)[1]
#     newFilename = filename + originalFileExtension

#     if os.path.exists(os.path.join(parentFolder, newFilename)):
#         return jsonify({"error": f"File {newFilename} already exists"}), 400
    
#     file.save(os.path.join(parentFolder, newFilename))
#     return jsonify({"filename": newFilename})

@app.route("/uploadFile", methods=["POST"])
def uploadFile():
    filename = request.form.get("filename")
    parentFolder = request.form.get("parentKey")
    parentFolder = os.path.join(BASE_DIR, parentFolder)

    file = request.files["file"]

    # change extension to original extension
    originalFileExtension = os.path.splitext(file.filename)[1]
    newFilename = filename + originalFileExtension

    if os.path.exists(os.path.join(parentFolder, newFilename)):
        return jsonify({"error": f"File {newFilename} already exists"}), 400
    
    # Save the uploaded file
    file_path = os.path.join(parentFolder, newFilename)
    print(file_path)
    file.save(file_path)

    # Call the main function from test.py and pass the uploaded file as a parameter
    encrypted_file_path = test.main(file_path, newFilename)

    # Get the filename from the encrypted file path
    encrypted_filename = os.path.basename(encrypted_file_path)
    
    # Move the encrypted file to the parentFolder path
    encrypted_file_dest = os.path.join(parentFolder, encrypted_filename)
    shutil.move(encrypted_file_path, encrypted_file_dest)

    os.remove(file_path)

    return jsonify({"filename": encrypted_filename})

@app.route("/viewFile", methods=["GET"])
def viewFile():
    filename = request.args.get("filename")
    parentFolder = request.args.get("parentKey")

    parentFolder = os.path.join(BASE_DIR, parentFolder)
    if not os.path.exists(os.path.join(parentFolder, filename)):
        return jsonify({"error": f"File {filename} does not exist"}), 400

    return send_file(os.path.join(parentFolder, filename), as_attachment=True)

@app.route('/rename-folder', methods=['POST'])
def rename_folder():
    try:
        data = request.get_json()
        parentFolder = data['folder_path']
        folder_name = data['folderName']
        new_folder_name = data['newFolderName']
        folder_path = os.path.join(parentFolder, folder_name)
        print(folder_path)
        new_folder_path = os.path.join(parentFolder, new_folder_name)
        os.rename(folder_path, new_folder_path)
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e))

# @app.route('/delete-folder', methods=['POST'])
# def delete_folder():
#     data = request.get_json()
#     parentFolder = data['folder_path']
#     folder_name = data['folderName']
#     folder_path = os.path.join(parentFolder, folder_name)
#     bin_folder_path = os.path.join(os.path.dirname(parentFolder), 'bin')
    
#     try:
#         if not os.path.exists(bin_folder_path):
#             os.makedirs(bin_folder_path)
#         # if folder_path == parentFolder:
#         #     return jsonify(success=False, error="Cannot delete 'all_folders' folder")
#         shutil.move(folder_path, bin_folder_path)
#         return jsonify(success=True)
#     except Exception as e:
#         return jsonify(success=False, error=str(e))

@app.route('/delete-folder', methods=['POST'])
def delete_folder():
    data = request.get_json()
    parentFolder = data['folder_path']
    folder_name = data['folderName']
    folder_path = os.path.join(parentFolder, folder_name)
    bin_folder_path = os.path.join(os.path.dirname(parentFolder), 'bin')
    
    try:
        if folder_name == "bin":
            return jsonify(success=True, error="Cannot delete 'bin' folder")
        
        if not os.path.exists(bin_folder_path):
            os.makedirs(bin_folder_path)

        shutil.move(folder_path, bin_folder_path)
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e))
   
@app.route("/getBinFolders")
def getBinFolders():
    bin_folder = os.path.join(BASE_DIR, "bin")
    folders = os.listdir(bin_folder)
    folders = [folder for folder in folders if os.path.isdir(os.path.join(bin_folder, folder))]
    print(folders)
    return jsonify(folders)

# @app.route("/getBinFolders")
# def getBinFolders():
#     bin_folder = os.path.join(BASE_DIR, "bin")
#     folders = os.listdir(bin_folder)
#     folders = [folder for folder in folders if os.path.isdir(os.path.join(bin_folder, folder))]
#     return render_template("dashboard.html", bin_folders = folders)

@app.route("/searchFolders", methods=["POST"])
def searchFolders():
    parentFolder = os.path.join(BASE_DIR, "all_folders")
    search_term = request.form["search_term"]
    search_results = []

    for folder in os.listdir(parentFolder):
        # If the search term is in the folder name, add the folder name to the search results list
        if search_term.lower() in folder.lower():
            search_results.append(folder)

    return jsonify(search_results)

@app.route("/logout")
def logout():
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)
