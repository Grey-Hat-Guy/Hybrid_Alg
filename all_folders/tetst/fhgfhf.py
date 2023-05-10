import aspose.words as aw
import os

fileNames = [for i in os.listdir() if i.endswith(".png")]

doc = aw.Document()
builder = aw.DocumentBuilder(doc)

shapes = [builder.insert_image(fileName) for fileName in fileNames]

pageSetup = builder.page_setup
pageSetup.page_width = max(shape.width for shape in shapes)
pageSetup.page_height = sum(shape.height for shape in shapes)
pageSetup.top_margin = 0
pageSetup.left_margin = 0
pageSetup.bottom_margin = 0
pageSetup.right_margin = 0

doc.save()