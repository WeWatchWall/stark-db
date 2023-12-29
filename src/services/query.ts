import FlatPromise from 'flat-promise';
import { DataSource } from "typeorm";

import {
  QueryParse,
  READ_ONLY_Qs,
  TABLE_MODIFY_Qs
} from "../parser/queryParse";
import { ScriptParse } from "../parser/scriptParse";
import { SIMPLE, VARS_TABLE } from "../utils/constants";
import { QueryUtils } from "../utils/queries";
import { Variable } from "../utils/variable";

export class Query {
  static async add(DB: DataSource, script: ScriptParse): Promise<any[]> {
    // Get the raw connection.
    const queryRunner = DB.createQueryRunner();
    const connection = await queryRunner.connect();

    // Add the extra queries.
    await Query.addExtraQueries(DB, script);

    const result: any[] = [];

    // Execute the queries.
    for (const query of script.queries) {
      // Execute the queries.
      const resultPromise = new FlatPromise();
      await connection
        .all(
          query.query,
          query.params,
          (err: any, rows: any) => {
            if (err) {
              resultPromise.reject(err);
              return;
            }

            resultPromise.resolve(rows);
          }
      );
      const resultRows: any[] = await resultPromise.promise;

      // Add the result to the array.
      result.push(...resultRows);
    }

    return result;
  }

  private static async addExtraQueries(
    DB: DataSource,
    script: ScriptParse
  ): Promise<void> {
    const queries: QueryParse[] = [];

    // Add the queries to the array.
    for (const query of script.queries) {
      queries.push(query);

      // Increment the DB version for every write query.
      if (!SIMPLE && !READ_ONLY_Qs.has(query.type)) {
        queries.push(new QueryParse({
          query: `UPDATE ${VARS_TABLE} SET value = (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.version}") + 1 WHERE name = "${Variable.version}";`,
          params: [],
        }));
      }

      if (SIMPLE || !TABLE_MODIFY_Qs.has(query.type)) { continue; }

      // Get the table modification queries.
      const tableQueries: QueryParse[] = await QueryUtils.getTableModify(
        DB,
        query
      );

      // Add the table modification queries.
      queries.push(...tableQueries);
    }

    // Add the queries to the script.
    script.queries = queries;
  } 
}