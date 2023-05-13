mod tagged_dom;

use std::env;
use std::error::Error;
use std::fs;
use std::io;
use std::io::Read;

#[macro_use]
extern crate maplit;
extern crate lazy_static;

fn fst_arg() -> Option<String> {
    let args: Vec<String> = env::args().skip(1).collect();

    let fst = args.first();

    fst.map(|p| p.to_string())
}

fn read_stdin() -> Result<String, Box<dyn Error>> {
    let mut buf: Vec<u8> = vec![];

    io::stdin().read_to_end(&mut buf)?;

    Ok(String::from_utf8(buf)?)
}

fn main() -> Result<(), Box<dyn Error>> {
    let html = match fst_arg() {
        Some(path) => fs::read_to_string(path)?,
        None => read_stdin()?,
    };

    let json = tagged_dom::Dom::parse(&html)?.to_json()?;

    println!("{}", json);

    Ok(())
}
