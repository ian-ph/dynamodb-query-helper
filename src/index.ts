interface FilterExpressionObject {
  column: string
  condition: string
  value: string
}

interface FilterExpressionAttribute {
  [key: string | number]: string
}

interface GeneratedFilterExpression {
  FilterExpression: string
  ExpressionAttributeNames: FilterExpressionAttribute
  ExpressionAttributeValues: FilterExpressionAttribute
}

export class DynamodbQueryHelper {
  public tableName: string

  public filterExpressions: FilterExpressionObject[] = []
  public filterExpressionAttributeNames: FilterExpressionAttribute = {}
  public filterExpressionAttributeValues: FilterExpressionAttribute = {}

  constructor (tableName: string) {
    this.tableName = tableName
  }

  /**
   * Captures the conditions to use for the DynamoDB document client
   *
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
   * Generate the aws document client parameter
   * @returns GeneratedFilterExpression The object you can use as parameter for the DynamoDB document client
   */
  public get (): GeneratedFilterExpression {
    const evaluatedExpression: string[] = []
    this.filterExpressions.forEach(filterExpression => {
      evaluatedExpression.push(`#${filterExpression.column} ${filterExpression.condition} :${filterExpression.column}`)
      this.filterExpressionAttributeNames[`#${filterExpression.column}`] = filterExpression.column
      this.filterExpressionAttributeValues[`:${filterExpression.column}`] = filterExpression.value
    })

    return {
      FilterExpression: evaluatedExpression.join(' AND '),
      ExpressionAttributeNames: this.filterExpressionAttributeNames,
      ExpressionAttributeValues: this.filterExpressionAttributeValues
    }
  }
}
