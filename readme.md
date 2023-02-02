# ScriptureStudy

A set of tools to study the Bible.

## ⚠️ Disclaimer

This is not affiliated to [BibleGateway](https://www.biblegateway.com) in any
way.

When using this tool you **must honour the copyright** of different translations
of the Bible (see
[BibleGateway's overview](https://www.biblegateway.com/versions/)). Using the
scripts with some versions is clearly breaking the copyright, that is not the
intended use of the code in this repository.

WEB and NET are used by default:

- The [WEB Bible](https://worldenglish.bible/) is open.
- The [NET translation](https://netbible.com/copyright/), has very generous
  copyright and should be permissible for personal study as well.

## Download 

To download the Bible from [BibleGateway](https://www.biblegateway.com/) run the
following script.

It requires Node.js to be installed.

```bash
$ cd scrapper
$ npm install
$ npm build
$ cd ..
$ mkdir -p bibles/{NET,WEB}
$ ./bin/download NET WEB
```

## Convert to Json

Convert the content of each chapter to a JSON format. The JSON format is used to
power the app.

This requires to first build and install the Rust script on `html2json` and to
have run the Download step as well, which is used as the input.

The script uses [GNU's parallel](https://www.gnu.org/software/parallel/).

```bash
$ cd html2json
$ cargo install --path .
$ cd ..
$ ./bin/extract-all
```

## Build the index

The app also requires an index. The `make-index` script fetches all the chapter
titles in order and builds an index of the Bible.

```bash
$ ./bin/make-index
$ cp index.json bibles/index.json
```

## Run the app

To run the app first generate the JSON for at least one Bible. The default ones
are NET and WEB (which have permisive copyrights), if you choose different ones
make sure to set the environment variables:

```bash
export NEXT_PUBLIC_DEFAULT_VERSION='NET'
export NEXT_PUBLIC_AVAILABLE_VERSIONS='NET,WEB'
export NEXT_PUBLIC_API_URL='http://localhost:8080'
```

Then [serve](https://www.npmjs.com/package/serve) the `bibles` directory from
the previous steps ([Download](#download), [Convert to Json](#convert-to-json),
and [Build the index](#build-the-index)).

```bash
$ serve --cors bibles -l 8080
```

And finally run the app:

```bash
$ cd app
$ yarn install
$ yarn dev
```
