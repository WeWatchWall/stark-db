import FlatPromise from 'flat-promise';
import { DataSource } from "typeorm";

import { UserArg } from '../objects/user';
import {
  QueryParse,
  READ_ONLY_Qs,
  TABLE_MODIFY_Qs
} from "../parser/queryParse";
import { ScriptParse } from "../parser/scriptParse";
import { SIMPLE, VARS_TABLE } from "../utils/constants";
import { QueryUtils } from "../utils/queries";
import { Variable } from "../utils/variable";
import { DBArg } from '../objects/DB';
import { ForbiddenError } from '@casl/ability';
import defineAbilityForDB from '../valid/DB';
import { DBOp } from '../utils/DBOp';

export class Query {
  static async add(
    user: UserArg,
    DB: DBArg,
    connection: DataSource,
    query: string,
    params: any[]
  ): Promise<any[]> {
    // Throw an error right away if the user doesn't have the read persmission.
    ForbiddenError
      .from(defineAbilityForDB(user))
      .throwUnlessCan(DBOp.Read, DB);
    
    // Parse the script.
    const script = new ScriptParse({
      script: query,
      params: params
    });

    // Throw an error if the user is writing and doesn't have write persmission.
    if (!script.isReadOnly) {
      ForbiddenError
        .from(defineAbilityForDB(user))
        .throwUnlessCan(DBOp.Write, DB);
    }

    // Get the raw connection.
    const queryRunner = connection.createQueryRunner();
    const connectionRaw = await queryRunner.connect();

    // Add the extra queries.
    await Query.addExtraQueries(connection, script);

    const result: any[] = [];

    // Execute the queries.
    for (const query of script.queries) {
      // Execute the queries.
      const resultPromise = new FlatPromise();
      await connectionRaw
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
      if (!resultRows.length) { continue; }

      result.push(resultRows);
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