<?php

namespace AmzsCMS\GalleryBundle\Repository;


use AmzsCMS\GalleryBundle\Entity\Gallery;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Gallery>
 */
class GalleryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Gallery::class);
    }

    public function findAllFolderGalleries()
    {
        return $this->createQueryBuilder('g')
            ->select(['g.id', 'g.name'])
            ->where("g.type = :type and g.isArchived = false")
            ->setParameter('type', 'folder')->getQuery()->getResult();
    }
    public function findWithPictures(array $ids): array
    {
        if (!$ids) {
            return [];
        }

        return $this->createQueryBuilder('g')
            ->leftJoin('g.picturies', 'p', 'WITH', 'p.isArchived = false')
            ->addSelect('p')
            ->where('g.id IN (:ids)')
            ->setParameter('ids', $ids)
            ->andWhere('g.isArchived = false')
            ->addOrderBy('g.sort', 'ASC')
            ->addOrderBy('p.sortOrder', 'ASC')
            ->getQuery()
            ->getResult();
    }
    //    /**
    //     * @return User[] Returns an array of User objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('u.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?User
    //    {
    //        return $this->createQueryBuilder('u')
    //            ->andWhere('u.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }

    // lay danh sach gallery voi type la post (default val cms)
    public function getPaginated(?string $keyword, $type, $filters = []): \Doctrine\ORM\QueryBuilder
    {
        $qb = $this->createQueryBuilder('gallery');
        $qb->where('gallery.type = :type');
        $qb->setParameter('type', $type);

        if(!empty($keyword)) {
            $qb->andWhere('gallery.name LIKE :keyword');
            $qb->setParameter('keyword', '%'.$keyword.'%');
        }

        return $qb;
    }
}
