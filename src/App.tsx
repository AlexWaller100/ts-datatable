import React, { useEffect } from 'react';
import { DataTable, CustomEditorProps } from './lib';
import initSqlJs from 'sql.js';
import './App.css';
import { cloneDeep } from 'lodash';

type ThenArg<T> = T extends Promise<infer U> ? U : T;
type SQL = ThenArg<ReturnType<typeof initSqlJs>>;
type SQLDatabase = InstanceType<SQL['Database']>;

let DB: SQLDatabase | null = null;
const pokemon: Pokemon[] = require('./dataset.json').pokemon;

// function notEmpty<T>(value: T | null | undefined): value is T {
//   return (value !== null && typeof value !== 'undefined');
// }

const addBodyClass = (className: string) => document.body.classList.add(className);
const removeBodyClass = (className: string) => document.body.classList.remove(className);

function sqliteParams(obj: any): any {
  let result: any = {};
  let keys = Object.keys(obj);
  for (let k of keys) {
    result[':' + k] = obj[k];
  }
  return result;
}

function query(sql: string, params?: any) {
  console.log('Running Query:', sql);
  let stmt = DB.prepare(sql);
  if (params) stmt.bind(params);

  let result: any[] = [];
  while (stmt.step()) {
    let dbRes = stmt.getAsObject();
    result.push(dbRes);
  }
  stmt.free();
  return result;
}

function App() {
  const [theme, setTheme] = React.useState('dark');
  const [, setDB] = React.useState<SQLDatabase | null>(null);
  useEffect(() => {
    addBodyClass(theme);
    return () => removeBodyClass(theme);
  }, [theme]);

  useEffect(() => {
    initSqlJs()
      .then(SQL => {
        DB = new SQL.Database();
        DB.run(`CREATE TABLE pokemon (
          id INTEGER primary key,
          num TEXT,
          name TEXT,
          img TEXT,
          type TEXT,
          height TEXT,
          weight TEXT,
          candy TEXT,
          candy_count INTEGER,
          egg TEXT,
          spawn_chance NUMERIC,
          avg_spawns NUMERIC,
          spawn_time TEXT,
          weaknesses TEXT,
          prev_evolution TEXT,
          next_evolution TEXT,
          evolves_to INTEGER
        );`);
        DB.run(`CREATE TABLE pokemon_types (name);`)

        let uniqueTypes = new Set<string>();
        let insertStmt = `INSERT INTO pokemon VALUES (:id,:num,:name,:img,:type,:height,:weight,:candy,:candy_count,:egg,:spawn_chance,:avg_spawns,:spawn_time,:weaknesses,:prev_evolution,:next_evolution,:evolves_to)`;
        for (let creature of pokemon) {
          uniqueTypes = new Set<string>([...uniqueTypes, ...creature.type]);

          let obj: any = cloneDeep(creature);

          if (Array.isArray(obj.type)) obj.type = obj.type.join(', ');
          if (Array.isArray(obj.weaknesses)) obj.weaknesses = obj.weaknesses.join(', ');
          if (Array.isArray(obj.prev_evolution)) obj.prev_evolution = obj.prev_evolution.map((v: any) => v.name).join(' => ');
          if (Array.isArray(obj.next_evolution)) {
            obj.evolves_to = Number(obj.next_evolution[0].num);
            obj.next_evolution = obj.next_evolution.map((v: any) => v.name).join(' => ');
          }
          
          DB.run(insertStmt, sqliteParams(obj));
        }

        for (let typeName of uniqueTypes) {
          DB.run(`INSERT INTO pokemon_types VALUES(?);`, [typeName]);
        }
        
        setDB(DB); // Needed for re-render
      })
      .catch(err => console.error(err));
  }, []);

  if (!DB) return <></>;

  return (
    <div className={`App`}>
      <header className="App-header">
        <button type='button' onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Toggle Theme</button>
      </header>
      <div>
        <DataTable<Pokemon>
          id='pokemon'
          filterSettings={{
            allowOr: true,
            allowNested: true,
            limitOneColumnUse: true,
          }}
          // data={pokemon} // Pass Data in directly
          // totalCount={5} // Total count to enable pagination
          multiColumnSorts={true}
          // Async data loading (recommended way)
          data={async ({ pagination, search, sorts, filters }) => {
            console.log('Running with filters:', filters);
            
            // This promise, timeout, and filter is all to
            // simulate an API call (sqlite calls synchrounous).
            return await new Promise(resolve => {
              setTimeout(() => {
                let params: any = {};
                let whereClauses: string[] = [];
                if (search) {
                  params[':search'] = `%${search}%`;
                  whereClauses.push(`(num LIKE :search OR name LIKE :search OR type LIKE :search)`);
                }
  
                let offset = (pagination.page - 1) * pagination.perPage;
                let len = pagination.perPage;
  
                let whereQuery = whereClauses.length
                  ? 'WHERE ' + whereClauses.join(' AND ')
                  : '';
  
                let orderBy = sorts.length
                  ? 'ORDER BY ' + sorts.map(s => `${s.column} ${s.direction}`).join(', ')
                  : '';
  
                let countResult = query(`
                  SELECT COUNT(*) as total
                  FROM pokemon
                  ${whereQuery}
                `, params);
  
                let fullResult = query(`
                  SELECT *
                  FROM pokemon
                  ${whereQuery}
                  ${orderBy}
                  LIMIT ${len} OFFSET ${offset}
                `, params);

                resolve({
                  total: countResult[0].total,
                  data: fullResult,
                });
              }, 750);
            });

            // Function doesn't _need_ to be async, could
            // be synchronous, though wouldn't really be an api call

            // let offset = (pagination.page - 1) * pagination.limit;
            // let len = (pagination.page * pagination.limit);
                
            // return {
            //   total: pokemon.length,
            //   data: pokemon.slice(offset, len),
            // };
          }}
          fixedColBg='var(--dt-fixed-bg, white)'
          paginateOptions={{
            buttonPosition: 'split',
            showFirstLast: true,
            perPageOptions: 'any',
          }}
          defaultSort={[
            {column: 'id', direction: 'asc'}
          ]}
          columns={[
            {
              header: 'ID',
              accessor: 'id',
              fixed: 'left',
              canToggleVisibility: false,
              filter: {
                type: 'number',
                parseAsType: 'number',
              },
            },
            {
              header: 'Num',
              accessor: 'num',
              defaultSortDir: 'desc',
              filter: {
                type: 'string',
              }
            },
            {
              header: 'Image',
              accessor: 'img',
              sortable: false,
              render: (value: any) => <img alt='' src={value} style={{maxHeight: '50px'}} />,
              filter: {
                type: 'boolean'
              }
            },
            {
              header: 'Name',
              accessor: 'name',
              filter: {
                type: 'string',
              },
            },
            {
              header: 'Type',
              accessor: 'type',
              sortable: false,
              render: (value: any) => {
                if (!value) return null;
                if (!Array.isArray(value)) return value;
                return value.join(', ');
              },
              filter: {
                type: 'custom',
                toDisplay: (value: any) => value,
                Editor: CustomTypeSelectEditor
              }
            },
            {
              header: 'Size',
              columns: [
                {
                  header: 'Height',
                  accessor: 'height'
                },
                {
                  header: 'Weight',
                  accessor: 'weight'
                }
              ]
            },
            {
              header: 'Weaknesses',
              accessor: 'weaknesses',
              sortable: false,
              render: (value: any) => {
                if (!value) return null;
                if (!Array.isArray(value)) return value;
                return value.join(', ');
              },
              filter: {
                type: 'custom',
                toDisplay: (value: any) => value,
                Editor: CustomTypeSelectEditor
              }
            },
            {
              header: 'Candy',
              accessor: 'candy',
              className: 'no-wrap fw',
              filter: {
                type: 'string',
              }
            },
            {
              header: 'Candy Count',
              className: 'no-wrap',
              accessor: 'candy_count',
              filter: {
                type: 'number',
                parseAsType: 'number',
              }
            },
            {
              header: 'Egg',
              accessor: 'egg'
            },
            {
              header: 'Evolves To',
              accessor: 'next_evolution',
              className: 'no-wrap',
              sortable: false,
              render: (value: any) => {
                if (!value) return null;
                if (!Array.isArray(value)) return value;
                return value.map(v => v.name).join(' => ');
              }
            },
            {
              header: 'Evolves From',
              accessor: 'prev_evolution',
              className: 'no-wrap',
              sortable: false,
              render: (value: any) => {
                if (!value) return null;
                if (!Array.isArray(value)) return value;
                return value.map(v => v.name).join(' => ');
              }
            },
            {
              header: 'Spawn Chance',
              accessor: 'spawn_chance',
              className: 'no-wrap',
              render: (value: any) => `${(value * 100).toPrecision(3)}%`
            },
            {
              header: 'Avg. Spawns',
              accessor: 'avg_spawns',
              className: 'no-wrap',
            },
            {
              header: 'Spawn Time',
              accessor: 'spawn_time',
              className: 'no-wrap',
              fixed: 'right'
            },
          ]}
        />
      </div>
    </div>
  );
}

export default App;

interface Pokemon {
  id: number;
  num: string;
  name: string;
  img: string;
  type: string[];
  height: string;
  weight: string;
  candy: string;
  candy_count?: number;
  egg: string;
  spawn_chance: number;
  avg_spawns: number;
  spawn_time: string;
  multipliers: number[] | null;
  weaknesses: string[];
  prev_evolution?: Evolution[];
  next_evolution?: Evolution[];
}

interface Evolution {
  num: string;
  name: string;
}

interface TypeEditorState {
  options: DBPokemonType[];
}

class CustomTypeSelectEditor extends React.Component<CustomEditorProps, TypeEditorState> {
  state = {
    options: [] as DBPokemonType[]
  }

  componentDidMount() {
    let types: DBPokemonType[] = query('SELECT * FROM pokemon_types;');
    this.setState({ options: types });
  }
  render() {
    const { inputRef, value, allValues, setValue } = this.props;
    const { options } = this.state;
    
    let hideable = Array.isArray(allValues);
    return <select ref={(el) => inputRef.current = el} value={value ?? ''} onChange={(e) => setValue(e.target.value)}>
      <option></option>
      {options.map(t => {
        if (hideable && value !== t.name && allValues.includes(t.name))
          return null;
        return <option key={t.name} value={t.name}>{t.name}</option>
      }).filter(e => !!e)}
    </select>
  }
}

interface DBPokemonType {
  name: string;
}