#!/usr/bin/env bash

# exit on first error
set -e

SCRIPT_PARENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
DATABASE_NAME="news_test"; 

psql --set database_name=news_test < "${SCRIPT_PARENT_DIR}/../../data/create.pgsql"
psql --set base_path=${SCRIPT_PARENT_DIR} $DATABASE_NAME < tests.pgsql

exit $?
