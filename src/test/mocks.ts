export const MOCKS: Record<string, any> = {}

export const mockPlan = {
  numFiles: 0,
  pdv: 0,
  plan: 'pro-discount' as any,
}
export const mockSubscriptions = [{ id: '1', status: 'active' }]

export const mockWorkbook = {
  id: 'us_wb_1',
  name: 'workbook1',
  sheets: [
    {
      id: 'us_sh_1',
      name: 'sheet1',
      workbookId: 'us_wb_1',
      config: { name: 'sheet1', fields: [] },
    },
    {
      id: 'us_sh_2',
      name: 'sheet2',
      workbookId: 'us_wb_1',
      config: { name: 'sheet2', fields: [] },
    },
  ],
  spaceId: 'space1',
  environmentId: 'env1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
