import dotenv from 'dotenv';

dotenv.config();

const portaPadrao = 3000;

export const env = {
  porta: Number(process.env.PORT ?? portaPadrao),
  bancoUrl:
    process.env.DATABASE_URL ??
    'postgresql://abp4user:abp4pass@localhost:5432/abp4'
};
