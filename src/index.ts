interface ExpressionObject {
  column: string
  condition: string
  value: string
}

interface FilterExpressionAttribute {
  [key: string | number]: string
}

interface GeneratedFilterExpression {
  KeyConditionExpression?: string
  FilterExpression?: string
  ExpressionAttributeNames: FilterExpressionAttribute
  ExpressionAttributeValues: FilterExpressionAttribute
  Limit?: number
  IndexName?: string
  TableName: string
}

export class DynamodbQueryHelper {
  public tableName: string
  public indexName: string | null = null
  public keyExpressions: ExpressionObject[] = []
  public filterExpressions: ExpressionObject[] = []
  public filterExpressionAttributeNames: FilterExpressionAttribute = {}
  public filterExpressionAttributeValues: FilterExpressionAttribute = {}
  public returnedDataLimit: number | null = null

  constructor (tableName: string) {
    this.tableName = tableName
  }

  public useIndex (indexName: string): DynamodbQueryHelper {
    this.indexName = indexName

    return this
  }

  /**
   * Captures the conditions to use for the DynamoDB document client
   * @param column string The column name of the document
   * @param condition string the condition to use for filtering
   * @param value string The value to use for filtering
   * @returns DynamodbQueryHelper
   */
  public where (column: string, condition: string, value: string): DynamodbQueryHelper {
    this.filterExpressions.push({
      column,
      condition,
      value
    })

    return this
  }

  /**
   * Captures the key condition to use for the DynamoDB document client
   * @param column string The column name of the document
   * @param condition string the condition to use for filtering
   * @param value string The value to use for filtering
   * @param indexName string The name of index to use, leaving this empty will default to the table's primary key
   * @returns
   */
  public whereKey (column: string, condition: string, value: string): DynamodbQueryHelper {
    this.keyExpressions.push({
      column,
      condition,
      value
    })

    return this
  }

  /**
   * Set the limit of records to be returned when you fetch from the DynamoDB document client
   * @param limitAmount number The maximum amount of rows to be returned
   * @returns DynamodbQueryHelper
   */
  public limit (limitAmount: number): DynamodbQueryHelper {
    this.returnedDataLimit = limitAmount

    return this
  }

  /**
   * Generate the aws document client parameter
   * @returns GeneratedFilterExpression The object you can use as parameter for the DynamoDB document client
   */
  public get (): GeneratedFilterExpression {
    const evaluatedFilterExpression: string[] = []
    const evaluatedKeyExpression: string[] = []

    // evaluate key filter
    this.keyExpressions.forEach(keyExpression => {
      evaluatedKeyExpression.push(`#${keyExpression.column} ${keyExpression.condition} :${keyExpression.column}`)
      this.filterExpressionAttributeNames[`#${keyExpression.column}`] = keyExpression.column
      this.filterExpressionAttributeValues[`:${keyExpression.column}`] = keyExpression.value
    })

    // evaluate filters
    this.filterExpressions.forEach(filterExpression => {
      evaluatedFilterExpression.push(`#${filterExpression.column} ${filterExpression.condition} :${filterExpression.column}`)
      this.filterExpressionAttributeNames[`#${filterExpression.column}`] = filterExpression.column
      this.filterExpressionAttributeValues[`:${filterExpression.column}`] = filterExpression.value
    })

    const result: GeneratedFilterExpression = {
      TableName: this.tableName,
      ExpressionAttributeNames: this.filterExpressionAttributeNames,
      ExpressionAttributeValues: this.filterExpressionAttributeValues
    }

    // set the key conditions, if there's any
    if (evaluatedKeyExpression.length > 0) {
      result.KeyConditionExpression = evaluatedKeyExpression.join(' AND ')
    }

    // set the filter conditions, if there's any
    if (evaluatedFilterExpression.length > 0) {
      result.FilterExpression = evaluatedFilterExpression.join(' AND ')
    }

    // set the limit, if given
    if (this.returnedDataLimit !== null) {
      result.Limit = this.returnedDataLimit
    }

    // set the index to use, if given
    if (this.indexName !== null) {
      result.IndexName = this.indexName
    }

    return result
  }
}
