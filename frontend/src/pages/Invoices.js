import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Form, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { rentedRoomService } from '../services/rentedRoomService';
import { roomService } from '../services/roomService';
import { houseService } from '../services/houseService';
import InvoiceModal from '../components/InvoiceModal';
import InvoiceDetailModal from '../components/InvoiceDetailModal';
import InvoiceFilters from '../components/InvoiceFilters';
import { calculateTotal, generatePDFHTML, getInvoiceColumns } from '../utils/invoiceUtils';
import dayjs from 'dayjs';


const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [viewInvoiceModal, setViewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [electricityUnitPrice, setElectricityUnitPrice] = useState(3500); // Default price per kWh
  const [previousElectricityNum, setPreviousElectricityNum] = useState(0);
  const [roomsAll, setRoomsAll] = useState([]);
  const [housesAll, setHousesAll] = useState([]);

  const contractId = searchParams.get('contract');

  // Filter states
  const [filters, setFilters] = useState({
    houseId: null,
    contractId: null,
    status: null,
    month: null,
  });

  useEffect(() => {
    fetchContracts();
    if (contractId) {
      fetchInvoicesByContract(contractId);
    } else {
      fetchAllInvoices();
    }
  }, [contractId]);

  useEffect(() => {
    // Load rooms and houses for UI labels
    (async () => {
      try {
        const [allRooms, houses] = await Promise.all([
          roomService.getAll(),
          houseService.getAll(),
        ]);
        setRoomsAll(allRooms || []);
        setHousesAll(houses || []);
      } catch (_) {}
    })();
  }, []);

  const roomsMap = useMemo(() => {
    const m = {};
    roomsAll.forEach(r => { m[r.room_id] = r; });
    return m;
  }, [roomsAll]);

  const housesMap = useMemo(() => {
    const m = {};
    housesAll.forEach(h => { m[h.house_id] = h; });
    return m;
  }, [housesAll]);

  const contractsMap = useMemo(() => {
    const m = {};
    contracts.forEach(c => { m[c.rr_id] = c; });
    return m;
  }, [contracts]);

  const fetchContracts = async () => {
    try {
      const data = await rentedRoomService.getAll();
      setContracts(data.filter(contract => contract.is_active));
    } catch (error) {
      message.error('Lỗi khi tải danh sách hợp đồng!');
    }
  };

  const fetchInvoicesByContract = async (contractId) => {
    setLoading(true);
    try {
      const data = await invoiceService.getByRentedRoom(contractId);
      setInvoices(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setEditingInvoice(null);
    form.resetFields();
    
    if (contractId) {
      const cid = Number(contractId);
      form.setFieldsValue({ rr_id: cid });

      // Get contract details and previous invoices
      const contract = contracts.find(c => c.rr_id === cid);
      if (contract) {
        // Set prices from contract
        form.setFieldsValue({ 
          price: contract.monthly_rent,
          water_price: contract.water_price || 80000,
          internet_price: contract.internet_price || 100000,
          general_price: contract.general_price || 100000
        });

        // Set electricity unit price from contract
        setElectricityUnitPrice(contract.electricity_unit_price || 3500);

        // Get previous invoices to determine current previous meter reading
        try {
          const previousInvoices = await invoiceService.getByRentedRoom(cid);
          let prevReading = Number(contract.initial_electricity_num || 0);

          if (previousInvoices && previousInvoices.length > 0) {
            const totalUsage = previousInvoices.reduce((sum, inv) => sum + Number(inv.electricity_num || 0), 0);
            prevReading += totalUsage;
          }

          setPreviousElectricityNum(prevReading);
          form.setFieldsValue({
            previous_electricity_num: prevReading
          });
        } catch (error) {
          console.error('Error fetching previous invoices:', error);
        }
      }
    }
    setModalVisible(true);
  };

  const handleEdit = async (record) => {
    setEditingInvoice(record);
    // Set unit price from the related contract if available
    const contract = contracts.find(c => c.rr_id === record.rr_id);
    if (contract) {
      setElectricityUnitPrice(contract.electricity_unit_price || 3500);
    }

    // Compute previous/current readings exactly as at creation time
    try {
      const list = await invoiceService.getByRentedRoom(record.rr_id);
      // sort by due_date then created_at as tie-breaker
      const sorted = [...(list || [])].sort((a, b) => {
        const ad = new Date(a.due_date).getTime();
        const bd = new Date(b.due_date).getTime();
        if (ad !== bd) return ad - bd;
        const ac = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bc = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ac - bc;
      });
      const idx = sorted.findIndex(i => i.invoice_id === record.invoice_id);
      let prevReading = Number(contract?.initial_electricity_num || 0);
      if (idx > 0) {
        for (let i = 0; i < idx; i++) {
          prevReading += Number(sorted[i].electricity_num || 0);
        }
      }
      const currReading = prevReading + Number(record.electricity_num || 0);
      setPreviousElectricityNum(prevReading);
      form.setFieldsValue({
        ...record,
        previous_electricity_num: prevReading,
        current_electricity_num: currReading,
        electricity_price: record.electricity_price || 0,
        due_date: dayjs(record.due_date),
        payment_date: record.payment_date ? dayjs(record.payment_date) : null,
      });
    } catch (e) {
      // Fallback: treat previous as 0, current as usage
      setPreviousElectricityNum(0);
      form.setFieldsValue({
        ...record,
        previous_electricity_num: 0,
        current_electricity_num: record.electricity_num || 0,
        electricity_price: record.electricity_price || 0,
        due_date: dayjs(record.due_date),
        payment_date: record.payment_date ? dayjs(record.payment_date) : null,
      });
    }

    setModalVisible(true);
  };

  const handlePay = async (id) => {
    try {
      await invoiceService.pay(id);
      message.success('Thanh toán thành công!');
      if (contractId) {
        fetchInvoicesByContract(contractId);
      } else {
        fetchAllInvoices();
      }
    } catch (error) {
      message.error('Lỗi khi thanh toán!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Derive electricity usage (kWh) and ensure only backend-allowed fields are sent
      const prevNum = Number(values.previous_electricity_num || 0);
      const currNum = Number(values.current_electricity_num || 0);
      const usage = currNum >= prevNum ? (currNum - prevNum) : Number(values.electricity_num || 0);

      const basePayload = {
        price: Number(values.price || 0),
        water_price: Number(values.water_price || 0),
        internet_price: Number(values.internet_price || 0),
        general_price: Number(values.general_price || 0),
        electricity_price: Number(values.electricity_price || 0),
        electricity_num: Number(usage || 0),
        water_num: Number(values.water_num || 0),
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      };

      if (editingInvoice) {
        await invoiceService.update(editingInvoice.invoice_id, basePayload);
        message.success('Cập nhật hóa đơn thành công!');
      } else {
        const createPayload = { rr_id: values.rr_id, ...basePayload };
        const created = await invoiceService.create(createPayload);
        message.success('Tạo hóa đơn thành công!');
        // Show the created invoice (use result which already includes details)
        setSelectedInvoice(created);
        setViewInvoiceModal(true);
      }
      setModalVisible(false);
      if (contractId) {
        fetchInvoicesByContract(Number(contractId));
      } else {
        fetchAllInvoices();
      }
    } catch (error) {
      message.error('Lỗi khi lưu hóa đơn!');
    }
  };



  const handleElectricityChange = (currentNum) => {
    if (currentNum === null || currentNum === undefined) return;
    if (currentNum >= previousElectricityNum) {
      const usage = currentNum - previousElectricityNum;
      const price = usage * electricityUnitPrice;
      form.setFieldsValue({
        electricity_price: Math.round(price),
        electricity_num: usage,
        current_electricity_num: currentNum,
      });
    } else if (currentNum < previousElectricityNum) {
      message.warning('Số điện hiện tại ph��i lớn hơn hoặc bằng số điện kỳ trước!');
    }
  };

  const handlePreviousElectricityChange = (prevNum) => {
    if (prevNum === null || prevNum === undefined) return;
    setPreviousElectricityNum(Number(prevNum));
    const currentNum = Number(form.getFieldValue('current_electricity_num') || 0);
    if (currentNum >= prevNum) {
      const usage = currentNum - prevNum;
      const price = usage * electricityUnitPrice;
      form.setFieldsValue({
        electricity_price: Math.round(price),
        electricity_num: usage,
      });
    } else if (currentNum) {
      message.warning('Số điện hiện tại phải lớn hơn hoặc bằng số điện kỳ trước!');
      form.setFieldsValue({ electricity_price: 0, electricity_num: 0 });
    }
  };

  const handleContractChange = async (rrId) => {
    const contract = contracts.find(c => c.rr_id === rrId);
    if (contract) {
      // Set prices from contract
      form.setFieldsValue({
        price: contract.monthly_rent,
        water_price: contract.water_price || 80000,
        internet_price: contract.internet_price || 100000,
        general_price: contract.general_price || 100000
      });

      // Set electricity unit price from contract
      setElectricityUnitPrice(contract.electricity_unit_price || 3500);

      // Compute previous meter reading: initial + sum(previous usages)
      try {
        const previousInvoices = await invoiceService.getByRentedRoom(rrId);
        let prevReading = Number(contract.initial_electricity_num || 0);

        if (previousInvoices && previousInvoices.length > 0) {
          const totalUsage = previousInvoices.reduce((sum, inv) => sum + Number(inv.electricity_num || 0), 0);
          prevReading += totalUsage;
        }

        setPreviousElectricityNum(prevReading);
        form.setFieldsValue({
          previous_electricity_num: prevReading
        });
      } catch (error) {
        console.error('Error fetching previous invoices:', error);
      }
    }
  };

  const handleFilterChange = (changedFields) => {
    setFilters({ ...filters, ...changedFields });
  };

  const handleClearFilters = () => {
    setFilters({
      houseId: null,
      contractId: null,
      status: null,
      month: null,
    });
  };

  // Filter invoices based on filter state
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filter by house
      if (filters.houseId) {
        const invoiceRoom = invoice.rented_room?.room || roomsMap[contractsMap[invoice.rr_id]?.room_id];
        if (!invoiceRoom || invoiceRoom.house_id !== filters.houseId) {
          return false;
        }
      }

      // Filter by contract
      if (filters.contractId && invoice.rr_id !== filters.contractId) {
        return false;
      }

      // Filter by status
      if (filters.status !== null && filters.status !== undefined) {
        const isPaid = invoice.is_paid;
        if (filters.status === '1' && !isPaid) return false;
        if (filters.status === '0' && isPaid) return false;
      }

      // Filter by month
      if (filters.month) {
        const invoiceDate = dayjs(invoice.due_date);
        if (!invoiceDate.isSame(filters.month, 'month')) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, filters, roomsMap, contractsMap]);

  const handleViewInvoice = (record) => {
    setSelectedInvoice(record);
    setViewInvoiceModal(true);
  };

  const handleExportPDF = (invoice) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const roomFromInvoice = invoice.rented_room?.room;
    const roomName = roomFromInvoice?.name || roomsMap[contractsMap[invoice.rr_id]?.room_id]?.name || 'N/A';
    const houseName = (() => {
      if (roomFromInvoice && roomFromInvoice.house_id) {
        return housesMap[roomFromInvoice.house_id]?.name || 'N/A';
      }
      const fallbackRoom = roomsMap[contractsMap[invoice.rr_id]?.room_id] || {};
      return housesMap[fallbackRoom.house_id]?.name || 'N/A';
    })();

    printWindow.document.write(generatePDFHTML(invoice, roomName, houseName, calculateTotal));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDelete = async (id) => {
    try {
      await invoiceService.delete(id);
      message.success('Xóa hóa đơn thành công!');
      if (contractId) {
        fetchInvoicesByContract(contractId);
      } else {
        fetchAllInvoices();
      }
    } catch (error) {
      message.error('Lỗi khi xóa hóa đơn!');
    }
  };

  const columns = useMemo(() => getInvoiceColumns(
    calculateTotal,
    handleViewInvoice,
    handleExportPDF,
    handleEdit,
    handlePay,
    handleDelete,
    roomsMap,
    housesMap,
    contractsMap
  ), [roomsMap, housesMap, contractsMap]);

  return (
    <div>
      <Card
        title={`Quản lý hóa đơn${contractId ? ` - ${contracts.find(c => c.rr_id === Number(contractId))?.tenant_name}` : ''}`}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo hóa đơn mới
          </Button>
        }
      >
        <InvoiceFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          housesAll={housesAll}
          contracts={contracts}
          roomsMap={roomsMap}
        />

        <Table
          columns={columns}
          dataSource={filteredInvoices}
          rowKey="invoice_id"
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (_, size) => setPageSize(size),
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} hóa đơn`,
          }}
        />
      </Card>

      <InvoiceModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        form={form}
        editingInvoice={editingInvoice}
        contracts={contracts}
        contractId={contractId}
        roomsMap={roomsMap}
        previousElectricityNum={previousElectricityNum}
        onContractChange={handleContractChange}
        onPreviousElectricityChange={handlePreviousElectricityChange}
        onElectricityChange={handleElectricityChange}
      />

      <InvoiceDetailModal
        visible={viewInvoiceModal}
        onCancel={() => setViewInvoiceModal(false)}
        invoice={selectedInvoice}
        roomsMap={roomsMap}
        housesMap={housesMap}
        contractsMap={contractsMap}
        onExportPDF={handleExportPDF}
        calculateTotal={calculateTotal}
      />
    </div>
  );
};

export default Invoices;
