# -*- mode: python ; coding: utf-8 -*-

import eel
import os

eel_path = os.path.dirname(eel.__file__)

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        (os.path.join(eel_path, 'eel.js'), 'eel'),
        ('web', 'web')
    ],
    hiddenimports=['bottle_websocket'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
