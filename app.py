#!/usr/bin/python3

import os
from flask import Flask, render_template, request, flash, jsonify, url_for, redirect

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


@app.route("/getFolders")
def getFolders():
    folderkey = request.args.get("folderkey")
    parentFolder = os.path.join(BASE_DIR, folderkey)
    folders = os.listdir(parentFolder)
    folders = [folder for folder in folders if os.path.isdir(os.path.join(parentFolder, folder))]
    return jsonify(folders)

@app.route("/uploadFile", methods=["POST"])
def uploadFile():
    parentFolder = os.path.join(BASE_DIR, "all_folders")

    folderName = request.form.get("foldername") or "temp_folder"
    file = request.files["file"]

    if not os.path.isdir(os.path.join(parentFolder, folderName)):
        os.mkdir(os.path.join(parentFolder, folderName))

    folder_path = os.path.join(parentFolder, folderName)
    if not os.path.isdir(folder_path):
        return jsonify({"error": f"Folder {folderName} does not exist"}), 400

    file.save(os.path.join(folder_path, file.filename))
    return jsonify({"success": f"File {file.filename} uploaded successfully"}), 200


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


if __name__ == "__main__":
    app.run(debug=True)
