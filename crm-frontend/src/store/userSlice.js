import { useState, useCallback } from 'react';
import { userApi } from '../lib/api/endpoints.js';

export function useUserSlice() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userApi.list();
      setUsers(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, loading, fetchUsers, setUsers };
}
