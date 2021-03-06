from flask import Flask, render_template, send_file
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('base.html')


@app.route('/<path:path>')
def base_static(path):
    return send_file(os.path.join(app.root_path, path))


if __name__ == "__main__":
    app.run(host='127.0.0.1', port=8016, debug=False)
