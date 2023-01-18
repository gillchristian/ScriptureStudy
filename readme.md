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

## Run the app

To run the first generate the JSON for at least one Bible. The default ones are
NET and WEB (which have permisive copyrights), if you choose different ones make
sure to set the environment variables:

```bash
export REACT_APP_DEFAULT_VERSION='NET'
export REACT_APP_AVAILABLE_VERSIONS='NET,WEB'
```

Then [serve](https://www.npmjs.com/package/serve) the `bibles` directory fromt
the previous steps (Download and Convert to Json).

```bash
$ serve --cors bibles
```

By default the app fetches the JSON from `http://localhost:3000`. You can set a
different one:

```bash
export REACT_APP_API_URL="http://localhost:9999"
```

And finally run the app:

```bash
$ cd switcher
$ yarn install
$ PORT=8080 yarn start
```
