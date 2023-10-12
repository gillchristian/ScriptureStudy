/// This code is taken from the html_parser crate and adapted make the Node enum tagged
use html_parser;
use lazy_static::lazy_static;
use serde::{Serialize, Serializer};
use std::collections::BTreeMap;
use std::collections::HashMap;
use std::error::Error;
use std::fmt;
use std::str::FromStr;

pub type Attributes = HashMap<String, Option<String>>;

fn ordered_map<S: Serializer>(value: &Attributes, serializer: S) -> Result<S::Ok, S::Error> {
    let ordered: BTreeMap<_, _> = value.iter().collect();
    ordered.serialize(serializer)
}

/// Turns styles in HTML format and turns them into JSON.
///
/// This way, when handling the styles in JavaScript, we can `JSON.parse(`) them.
fn process_style(style_str: &str) -> String {
    serde_json::to_string(
        &style_str
            .split(';')
            .map(|rule| {
                let mut parts = rule.split(':');
                (
                    parts.next().unwrap().trim().to_string(),
                    parts.next().unwrap().trim().to_string(),
                )
            })
            .collect::<HashMap<String, String>>(),
    )
    .unwrap()
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

#[derive(Debug, Clone)]
struct ParseBibleVerseError;

impl fmt::Display for ParseBibleVerseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Failed to parse Bible verse")
    }
}

impl Error for ParseBibleVerseError {}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct BibleVerse {
    pub book: String,
    pub chapter: u32,
    pub verse: u32,
}

// <book>-<chapter>-<verse>
impl FromStr for BibleVerse {
    type Err = Box<dyn Error>;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let parts = s.split('-').collect::<Vec<_>>();
        if parts.len() != 3 {
            return Err(Box::new(ParseBibleVerseError));
        }

        Ok(Self {
            book: BY_SHORT
                .get(parts[0])
                .ok_or(Box::new(ParseBibleVerseError))?
                .to_string(),
            chapter: parts[1].parse::<u32>()?,
            verse: parts[2].parse::<u32>()?,
        })
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

    /// Information about Bible verses in the element
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verse: Option<BibleVerse>,
}

lazy_static! {
    static ref BY_SHORT: HashMap<&'static str, &'static str> = hashmap! {
        "Gen" => "genesis",
        "Exod" => "exodus",
        "Lev" => "leviticus",
        "Num" => "numbers",
        "Deut" => "deuteronomy",
        "Josh" => "joshua",
        "Judg" => "judges",
        "Ruth" => "ruth",
        "1Sam" => "1-samuel",
        "2Sam" => "2-samuel",
        "1Kgs" => "1-kings",
        "2Kgs" => "2-kings",
        "1Chr" => "1-chronicles",
        "2Chr" => "2-chronicles",
        "Ezra" => "ezra",
        "Neh" => "nehemiah",
        "Esth" => "esther",
        "Job" => "job",
        "Ps" => "psalm",
        "Prov" => "proverbs",
        "Eccl" => "ecclesiastes",
        "Song" => "song-of-solomon",
        "Isa" => "isaiah",
        "Jer" => "jeremiah",
        "Lam" => "lamentations",
        "Ezek" => "ezekiel",
        "Dan" => "daniel",
        "Hos" => "hosea",
        "Joel" => "joel",
        "Amos" => "amos",
        "Obad" => "obadiah",
        "Jonah" => "jonah",
        "Mic" => "micah",
        "Nah" => "nahum",
        "Hab" => "habakkuk",
        "Zeph" => "zephaniah",
        "Hag" => "haggai",
        "Zech" => "zechariah",
        "Mal" => "malachi",
        "Matt" => "matthew",
        "Mark" => "mark",
        "Luke" => "luke",
        "John" => "john",
        "Acts" => "acts",
        "Rom" => "romans",
        "1Cor" => "1-corinthians",
        "2Cor" => "2-corinthians",
        "Gal" => "galatians",
        "Eph" => "ephesians",
        "Phil" => "philippians",
        "Col" => "colossians",
        "1Thess" => "1-thessalonians",
        "2Thess" => "2-thessalonians",
        "1Tim" => "1-timothy",
        "2Tim" => "2-timothy",
        "Titus" => "titus",
        "Phlm" => "philemon",
        "Heb" => "hebrews",
        "Jas" => "james",
        "1Pet" => "1-peter",
        "2Pet" => "2-peter",
        "1John" => "1-john",
        "2John" => "2-john",
        "3John" => "3-john",
        "Jude" => "jude",
        "Rev" => "revelation"
    };
    static ref BY_BOOK: HashMap<&'static str, &'static str> = hashmap! {
        "genesis" => "Gen",
        "exodus" => "Exod",
        "leviticus" => "Lev",
        "numbers" => "Num",
        "deuteronomy" => "Deut",
        "joshua" => "Josh",
        "judges" => "Judg",
        "ruth" => "Ruth",
        "1-samuel" => "1Sam",
        "2-samuel" => "2Sam",
        "1-kings" => "1Kgs",
        "2-kings" => "2Kgs",
        "1-chronicles" => "1Chr",
        "2-chronicles" => "2Chr",
        "ezra" => "Ezra",
        "nehemiah" => "Neh",
        "esther" => "Esth",
        "job" => "Job",
        "psalm" => "Ps",
        "proverbs" => "Prov",
        "ecclesiastes" => "Eccl",
        "song-of-solomon" => "Song",
        "isaiah" => "Isa",
        "jeremiah" => "Jer",
        "lamentations" => "Lam",
        "ezekiel" => "Ezek",
        "daniel" => "Dan",
        "hosea" => "Hos",
        "joel" => "Joel",
        "amos" => "Amos",
        "obadiah" => "Obad",
        "jonah" => "Jonah",
        "micah" => "Mic",
        "nahum" => "Nah",
        "habakkuk" => "Hab",
        "zephaniah" => "Zeph",
        "haggai" => "Hag",
        "zechariah" => "Zech",
        "malachi" => "Mal",
        "matthew" => "Matt",
        "mark" => "Mark",
        "luke" => "Luke",
        "john" => "John",
        "acts" => "Acts",
        "romans" => "Rom",
        "1-corinthians" => "1Cor",
        "2-corinthians" => "2Cor",
        "galatians" => "Gal",
        "ephesians" => "Eph",
        "philippians" => "Phil",
        "colossians" => "Col",
        "1-thessalonians" => "1Thess",
        "2-thessalonians" => "2Thess",
        "1-timothy" => "1Tim",
        "2-timothy" => "2Tim",
        "titus" => "Titus",
        "philemon" => "Phlm",
        "hebrews" => "Heb",
        "james" => "Jas",
        "1-peter" => "1Pet",
        "2-peter" => "2Pet",
        "1-john" => "1John",
        "2-john" => "2John",
        "3-john" => "3John",
        "jude" => "Jude",
        "revelation" => "Rev"
    };
}

impl Element {
    pub fn from_html_parser(original: &html_parser::Element) -> Self {
        let verse = original
            .classes
            .iter()
            .find_map(|c| c.parse::<BibleVerse>().ok());

        let mut attributes = original.attributes.clone();
        attributes.get_mut("style").map(|s| match s {
            Some(s) => Some(process_style(s)),
            None => None,
        });

        let new_elem = Self {
            id: original.id.clone(),
            name: original.name.clone(),
            variant: ElementVariant::from_html_parser(&original.variant),
            attributes,
            classes: original.classes.clone(),
            children: original
                .children
                .iter()
                .map(|node| Node::from_html_parser(node))
                .filter(|node| !node.is_empty())
                .collect(),
            verse,
        };

        let is_small_caps = original.classes.iter().any(|c| c == "small-caps");

        if is_small_caps {
            // This is a hack to put spaces between words like "LORD"
            // because the space between <span>s is not being properly added
            // by the browser, whereas the HTML version of this does add them
            Self {
                id: None,
                name: "span".to_string(),
                variant: ElementVariant::Normal,
                attributes: HashMap::new(),
                classes: vec![],
                children: vec![
                    Node::Text("&nbsp;".to_string()),
                    Node::Element(new_elem),
                    Node::Text("&nbsp;".to_string()),
                ],
                verse: None,
            }
        } else {
            new_elem
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
            html_parser::Node::Text(text) => Self::Text(text.to_string()),
            html_parser::Node::Element(element) => {
                Self::Element(Element::from_html_parser(element))
            }
            html_parser::Node::Comment(comment) => Self::Comment(comment.clone()),
        }
    }

    pub fn is_empty(&self) -> bool {
        match self {
            Self::Text(text) => text.is_empty() || text == "end of notes",
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
