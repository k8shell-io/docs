# -*- coding: utf-8 -*-
# @author: Tomas Vitvar, https://vitvar.com, tomas@vitvar.com

from docutils import nodes
from docutils.parsers.rst import Directive
from docutils.parsers.rst import directives
import datetime
from docutils.nodes import raw
import requests
import os

from sphinx.builders.html import StandaloneHTMLBuilder
from sphinx.util.nodes import split_explicit_title


class GDrawing(Directive):
    required_arguments = 1

    def run(self):
        drawing_id = self.arguments[0]
        response = requests.get(f"https://docs.google.com/drawings/export/svg?id={drawing_id}")
        img_path = os.path.join(self.state.document.settings.env.app.outdir, "_static", "img", drawing_id + ".svg")
        web_path = os.path.join("/_static", "img", drawing_id + ".svg")
        os.makedirs(os.path.dirname(img_path), exist_ok=True)
        with open(img_path, "wb") as f:
            f.write(response.content)
        return [raw("", '<img src="{}"></img>'.format(web_path), format="html")]


class AbstractDirective(Directive):
    has_content = True

    def run(self):
        self.assert_has_content()
        text = "\n".join(self.content)
        node = nodes.container(text, classes=["abstract"])
        self.state.nested_parse(self.content, self.content_offset, node)
        return [node]


def black_circle_number_role(name, rawtext, text, lineno, inliner, options={}, content=[]):
    try:
        _ = int(text)
    except ValueError:
        raise inliner.reporter.error(
            f"Invalid number for black circle: {text}. Must be an integer.",
            line=lineno,
        )
    node = nodes.inline(text=text, classes=["black-circle-number"])
    return [node], []


def setup(app):
    app.add_directive("gdrawing", GDrawing)
    app.add_directive("abstract", AbstractDirective)
    app.add_role("c", black_circle_number_role)
