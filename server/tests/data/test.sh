#!/bin/sh
# TODO: The above seems like a poor assumption. Is it better to emit it altogether?

# exit on first error
set -e

SCRIPT_PARENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
DATABASE_NAME="news_test"; 

PSQL_COMMAND="psql --echo-queries --set=ON_ERROR_STOP=true";

# TODO: check return value and only continue if prior steps succeed.
perl -p -e "s/\\\$\{database_name\}/${DATABASE_NAME}/" < "${SCRIPT_PARENT_DIR}/../../data/create.sql"|$PSQL_COMMAND;
$PSQL_COMMAND $DATABASE_NAME < dklab_pgunit_2008-11-09.sql;
perl -p -e "s#\\\$\{base_path\}#${SCRIPT_PARENT_DIR}#" < "${SCRIPT_PARENT_DIR}/tests.pgsql"|$PSQL_COMMAND $DATABASE_NAME;

exit $?
