from flask import Flask, request, jsonify
from ultralytics import YOLO
from PIL import Image

app = Flask(__name__)
model_path = 'best.pt'
model = YOLO(model_path)  # 加载模型


@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["image"]
    image = Image.open(file.stream)
    results = model(image)
    boxes = []
    for box in results[0].boxes:
        xyxy = [int(x) for x in box.xyxy[0].tolist()]
        conf = round(float(box.conf[0]), 3)
        cls = int(box.cls[0])
        name = results[0].names[cls]
        boxes.append({
            'coor': xyxy,
            'conf': conf,
            'class': name
        })
    # print(boxes)
    return jsonify(boxes)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005)