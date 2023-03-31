/// This code is taken from the html_parser crate and adapted make the Node enum tagged
use html_parser;
use serde::{Serialize, Serializer};
use std::collections::BTreeMap;
use std::collections::HashMap;

pub type Attributes = HashMap<String, Option<String>>;

fn ordered_map<S: Serializer>(value: &Attributes, serializer: S) -> Result<S::Ok, S::Error> {
    let ordered: BTreeMap<_, _> = value.iter().collect();
    ordered.serialize(serializer)
}

/// Normal: `<div></div>` or Void: `<meta/>`and `<meta>`
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
// TODO: Align with: https://html.spec.whatwg.org/multipage/syntax.html#elements-2
pub enum ElementVariant {
    /// A normal element can have children, ex: <div></div>.
    Normal,
    /// A void element can't have children, ex: <meta /> and <meta>
    Void,
}

impl ElementVariant {
    pub fn from_html_parser(original: &html_parser::ElementVariant) -> Self {
        match original {
            html_parser::ElementVariant::Normal => Self::Normal,
            html_parser::ElementVariant::Void => Self::Void,
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Element {
    /// The id of the element
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,

    /// The name / tag of the element
    pub name: String,

    /// The element variant, if it is of type void or not
    pub variant: ElementVariant,

    /// All of the elements attributes, except id and class
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    #[serde(serialize_with = "ordered_map")]
    pub attributes: Attributes,

    /// All of the elements classes
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub classes: Vec<String>,

    /// All of the elements child nodes
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<Node>,
}

impl Element {
    pub fn from_html_parser(original: &html_parser::Element) -> Self {
        Self {
            id: original.id.clone(),
            name: original.name.clone(),
            variant: ElementVariant::from_html_parser(&original.variant),
            attributes: original.attributes.clone(),
            classes: original.classes.clone(),
            children: original
                .children
                .iter()
                .map(|node| Node::from_html_parser(node))
                .filter(|node| !node.is_empty())
                .collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum Node {
    Text(String),
    Element(Element),
    Comment(String),
}

impl Node {
    pub fn from_html_parser(original: &html_parser::Node) -> Self {
        match original {
            html_parser::Node::Text(text) => Self::Text(text.clone()),
            html_parser::Node::Element(element) => {
                Self::Element(Element::from_html_parser(element))
            }
            html_parser::Node::Comment(comment) => Self::Comment(comment.clone()),
        }
    }

    pub fn is_empty(&self) -> bool {
        match self {
            Self::Text(text) => text.is_empty(),
            Self::Element(_) => false,
            Self::Comment(_) => false,
        }
    }
}

/// Document, DocumentFragment or Empty
#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DomVariant {
    /// This means that the parsed html had the representation of an html document. The doctype is optional but a document should only have one root node with the name of html.
    /// Example:
    /// ```text
    /// <!doctype html>
    /// <html>
    ///     <head></head>
    ///     <body>
    ///         <h1>Hello world</h1>
    ///     </body>
    /// </html>
    /// ```
    Document,
    /// A document fragment means that the parsed html did not have the representation of a document. A fragment can have multiple root children of any name except html, body or head.
    /// Example:
    /// ```text
    /// <h1>Hello world</h1>
    /// ```
    DocumentFragment,
    /// An empty dom means that the input was empty
    Empty,
}

impl DomVariant {
    pub fn from_html_parser(original: &html_parser::DomVariant) -> Self {
        match original {
            html_parser::DomVariant::Document => Self::Document,
            html_parser::DomVariant::DocumentFragment => Self::DocumentFragment,
            html_parser::DomVariant::Empty => Self::Empty,
        }
    }
}

/// **The main struct** & the result of the parsed html
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Dom {
    /// The type of the tree that was parsed
    pub tree_type: DomVariant,

    /// All of the root children in the tree
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub children: Vec<Node>,

    /// A collection of all errors during parsing
    #[serde(skip_serializing)]
    pub errors: Vec<String>,
}

impl Dom {
    pub fn parse(html: &str) -> Result<Self, html_parser::Error> {
        Ok(Self::from_html_parser(&html_parser::Dom::parse(html)?))
    }

    pub fn to_json(&self) -> serde_json::Result<String> {
        serde_json::to_string(self)
    }

    fn from_html_parser(original: &html_parser::Dom) -> Self {
        Self {
            tree_type: DomVariant::from_html_parser(&original.tree_type),
            children: original
                .children
                .iter()
                .map(|node| Node::from_html_parser(node))
                .filter(|node| !node.is_empty())
                .collect(),
            errors: original.errors.clone(),
        }
    }
}
