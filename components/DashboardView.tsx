import React from 'react';
import { Card } from './SharedComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const DashboardView = () => {
  const data = [
    { name: 'Stationery', value: 400 },
    { name: 'IT Equip', value: 300 },
    { name: 'Furniture', value: 300 },
    { name: 'Vehicles', value: 200 },
  ];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Department Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total Inventory Value" className="bg-white">
          <div className="text-3xl font-bold text-gov-800">MVR 124,500.00</div>
          <div className="text-sm text-slate-500 mt-1">+2.5% from last month</div>
        </Card>
        <Card title="Pending Requests" className="bg-white">
          <div className="text-3xl font-bold text-orange-600">5</div>
          <div className="text-sm text-slate-500 mt-1">2 Urgent</div>
        </Card>
        <Card title="Low Stock Alerts" className="bg-white">
          <div className="text-3xl font-bold text-red-600">3</div>
          <div className="text-sm text-slate-500 mt-1">Items below min level</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Inventory Distribution">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Monthly Procurement Spend">
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{name: 'Jan', amt: 4000}, {name: 'Feb', amt: 3000}, {name: 'Mar', amt: 2000}, {name: 'Apr', amt: 2780}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amt" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};