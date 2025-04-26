export class USEModelWrapper {
    private model: any;
    
    constructor(originalModel: any) {
      this.model = originalModel;
    }
    
    async embed(sentences: string[]): Promise<any> {
      try {
        return await this.model.embed(sentences);
      } catch (error) {
        console.error('Error during embedding:', error);
        throw error;
      }
    }
  }