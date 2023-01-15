use html_parser::Dom;
use std::env;
use std::fs;
use std::io;
use std::io::Read;

fn fst_arg() -> Option<String> {
    let args: Vec<String> = env::args().skip(1).collect();

    let fst = args.first();

    fst.map(|p| p.to_string())
}

fn main() {
    let html = match fst_arg().and_then(|path| fs::read_to_string(path).ok()) {
        Some(html) => html,
        None => {
            let mut buf: Vec<u8> = vec![];

            io::stdin()
                .read_to_end(&mut buf)
                .ok()
                .filter(|bytes_read| bytes_read > &0)
                .and_then(|_| String::from_utf8(buf).ok())
                .expect("Failed to read stdin")
        }
    };

    let dom = match Dom::parse(&html) {
        Ok(dom) => dom,
        Err(err) => panic!("{}", err),
    };

    let json = match dom.to_json() {
        Ok(json) => json,
        Err(err) => panic!("{}", err),
    };

    println!("{}", json);
}
