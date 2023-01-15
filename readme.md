# ScriptureStudy

A set of tools to study the Bible.

## Download 

To download the Bible from [BibleGateway](https://www.biblegateway.com/) run the
following script.

It requires Node.js to be installed.

```bash
$ cd scrapper
$ npm install
$ npm build
$ cd ..
$ mkdir -p bibles/{NET,NLT,NIV}
$ ./bin/download NET NLT NIV
```

## Convert to Json

Convert the content of each chapter to a JSON format.

This requires to first build and install the Rust script on `html2json` and to
have run the Download step as well.

The script uses [GNU's parallel](https://www.gnu.org/software/parallel/).

```bash
$ cd html2json
$ cargo install --path .
$ cd ..
$ ./bin/extract-all
```
